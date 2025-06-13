package gosrc

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"text/template"
)

func MakeRootDir() string {
	baseDir, err := os.UserHomeDir()
	if err != nil {
		panic(err)
	}
	baseDir = baseDir + "/.lemon2/"
	exec.Command("mkdir", "-p", baseDir).Run()
	return baseDir
}

func CreateRootPath(filename string) string {
	baseDir, err := os.UserHomeDir()
	if err != nil {
		panic(err)
	}
	baseDir = baseDir + "/.lemon2/"
	exec.Command("mkdir", "-p", baseDir).Run()
	filepath := baseDir + filename
	log.Println(filepath)
	exec.Command("touch", filepath).Run()
	return filepath
}

func WriteRootFile(filename string, content string) {
	pacFilePath := CreateRootPath(filename)
	x := []byte(content)
	err := os.WriteFile(pacFilePath, x, 0644)
	if err != nil {
		fmt.Println("文件写入失败", pacFilePath)
	} else {
		fmt.Println("文件写入成功", pacFilePath)
	}
}

type IFrontConfig struct {
	HttpPort     int64  `json:"httpPort"`
	SocksPort    int64  `json:"socksPort"`
	PacPort      int64  `json:"pacPort"`
	PacDirect    string `json:"pacDirect"`
	PacProxy     string `json:"pacProxy"`
	RemotePacUrl string `json:"remotePacUrl"`
}

type PacServer struct {
	Status string       // off关闭 proxy默认代理 direct默认直连
	server *http.Server // Store the server instance
}

// NewApp creates a new App application struct
func NewPacServer() *PacServer {
	return &PacServer{
		Status: "off",
	}
}

func (ins *PacServer) GetFrontConfig() IFrontConfig {
	value, err := os.ReadFile(CreateRootPath("v2ray.all.json"))
	// 定义目标变量
	var v IFrontConfig
	if err != nil {
		fmt.Printf("read v2ray.all.json fail", err)
		return v
	}

	// 解码 JSON
	err = json.Unmarshal([]byte(value), &v)
	if err != nil {
		fmt.Println("解码失败:", err)
	}
	return v
}

func (ins *PacServer) SetStatus(status string) {
	ins.Status = status
}

func (ins *PacServer) Start() {
	frontConfig := ins.GetFrontConfig()
	ins.CreateHTTPServer()
	ins.CreatePacFile("127.0.0.1", "proxy.js")
	ins.CreatePacFile(GetLocalIP(), "proxy.remote.js")
	network := NewNetworkSetup()
	url := fmt.Sprintf("http://127.0.0.1:%d/proxy.js", frontConfig.PacPort)
	if strings.HasSuffix(frontConfig.RemotePacUrl, "http") {
		url = frontConfig.RemotePacUrl
	}
	network.SetPacUrl(url)
}

func (ins *PacServer) Stop() {
	network := NewNetworkSetup()
	network.ClearPacUrl()
	network.DisableGlobalProxy()
	ins.StopHTTPServer()
}

func (ins *PacServer) CreatePacFile(IP string, filename string) {
	const tpl = `// http://{{.IP}}:{{.PacPort}}/proxy.js
var proxy = 'SOCKS5 {{.SocksAddress}}; SOCKS {{.SocksAddress}};'
var direct = 'DIRECT;'
var pacMode = '{{.pacMode}}';

function checkMatch(url, host, rule) {
    if (/^https?:/.test(rule)) {
        return url.startsWith(rule)
    }
    return host.includes(rule)
}

function FindProxyForURL(url, host) {
    if (pacMode == 'global') {
		return proxy;
	}
	for (var i = 0; i < pacDirectRules.length; i++) {
		if (checkMatch(url, host, pacDirectRules[i])) {
			return direct
		}
	}
	for (var i = 0; i < pacProxyRules.length; i++) {
		if (checkMatch(url, host, pacProxyRules[i])) {
			return proxy
		}
	}
	if (pacMode == 'proxy') {
		return proxy;
	}
	return direct;
}
var pacDirectRules = {{.PacDirect}};
var pacProxyRules = {{.PacProxy}};
`
	frontConfig := ins.GetFrontConfig()

	// 读取config

	// 获取ip地址
	t, err := template.New("pac").Parse(tpl)
	if err != nil {
		panic(err)
	}

	// 创建一个 bytes.Buffer 用于存储模板的输出
	var buf bytes.Buffer

	PacProxy, PacDirect := CreateGfwServer().ParseGFW(frontConfig.PacProxy, frontConfig.PacDirect)
	SocksAddress := IP + ":" + fmt.Sprintf("%d", frontConfig.SocksPort)

	err = t.Execute(&buf, map[string]interface{}{
		"pacMode":      ins.Status,
		"PacDirect":    PacDirect,
		"PacProxy":     PacProxy,
		"IP":           IP,
		"SocksAddress": SocksAddress,
		"PacPort":      frontConfig.PacPort,
	})
	if err != nil {
		panic(err)
	}
	WriteRootFile(filename, buf.String())
}

func (ins *PacServer) CreateHTTPServer() {
	frontConfig := ins.GetFrontConfig()
	staticDir := MakeRootDir()
	// 创建文件服务器，服务 static 目录
	fs := http.FileServer(http.Dir(staticDir))

	mux := http.NewServeMux()

	// 包装文件服务器，禁用目录列表
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// 如果请求的是目录，尝试加载 index.html
		if r.URL.Path != "/" {
			fs.ServeHTTP(w, r)
			return
		}
		w.Header().Set("Access-Control-Allow-Origin", "*")
		http.ServeFile(w, r, "proxy.js")
	})

	dport := fmt.Sprintf(":%d", frontConfig.PacPort)

	// Start server in a goroutine
	ins.server = &http.Server{
		Addr:    dport,
		Handler: mux,
	}
	log.Println("pac server listen port:" + dport)
	if err := ins.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("pac server start failed: %v", err)
	}
}

// StopHTTPServer explicitly stops the HTTP server
func (ins *PacServer) StopHTTPServer() error {
	if ins.server == nil {
		return fmt.Errorf("pac server is not running")
	}

	log.Println("Stopping server...")
	if err := ins.server.Close(); err != nil {
		log.Printf("Pac Server close error: %v", err)
		return err
	}
	log.Println("Pac Server closed")
	ins.server = nil // Clear server reference
	return nil
}

func Logger(name string) {
	// 指定日志文件路径
	logFilePath := CreateRootPath("lemon2.log")

	// 打开或创建日志文件（追加模式，权限 0644）
	file, err := os.OpenFile(logFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatalf("canot open log file: %v", err)
	}
	defer file.Close()

	// 设置日志输出到文件
	log.SetOutput(file)

	// 设置日志前缀和标志（可选）
	log.SetPrefix("[lemon2] ")
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.Println(name)
}

func (ins *PacServer) GetPacContent() string {
	value, err := os.ReadFile(CreateRootPath("proxy.js"))
	// 定义目标变量
	if err != nil {
		return ""
	}
	return string(value)
}
