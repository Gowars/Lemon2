package gosrc

import (
	"embed"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type AppConfig struct {
	PacServerPort int64
	SocksPort     int64
	HttpPort      int64
	ConfigPath    string
}

type V2rayCore struct {
	PId             string
	Config          string
	v2rayCmd        *exec.Cmd
	v2rayFilePath   string
	ConfigPath      string
	FrontConfigPath string
	Assets          embed.FS
	AppDir          string
	PacServer       *PacServer
	ctx             *application.App
}

func resolvePath(src string) string {
	home, err := os.UserHomeDir()
	if err != nil {
		log.Panic(err)
	}
	return home + "/.lemon2" + src
}

// NewApp creates a new App application struct
func NewV2rayCore(assets embed.FS, pacServer *PacServer, ctx *application.App) *V2rayCore {
	return &V2rayCore{
		AppDir:          resolvePath(""),
		ConfigPath:      resolvePath("/v2ray.config.json"),
		FrontConfigPath: resolvePath("/v2ray.all.json"),
		Assets:          assets,
		PacServer:       pacServer,
		ctx:             ctx,
	}
}

func (v *V2rayCore) KillV2ray() {
	if v.v2rayCmd != nil {
		v.v2rayCmd.Process.Kill()
		v.v2rayCmd = nil
	}
	// 强制kill一下
	cmd := exec.Command("bash", "-c", "ps aux | grep v2ray-lemon2 | awk '{ print $2 }' | xargs kill")
	cmd.CombinedOutput()
}

func (v *V2rayCore) Start() string {
	log.Println("-------v2ray start-----")
	// 临时路径保存二进制文件
	tempDir := os.TempDir()
	tempPath := filepath.Join(tempDir, "v2ray-lemon2")
	v.v2rayFilePath = tempPath

	_, err := os.Stat(tempPath)
	if err == nil {
		os.Remove(tempPath)
	}

	// 从嵌入的 FS 中读取二进制文件
	data, err := v.Assets.ReadFile("frontend/dist/v2ray-macos-64/v2ray")
	if err != nil {
		log.Fatalln("读取二进制文件失败")
	}

	log.Println("v2ray path: %s", tempPath)

	// 写入临时文件
	err = os.WriteFile(tempPath, data, 0755) // 确保可执行权限
	if err != nil {
		log.Fatalln("写入临时文件失败")
	}

	v.KillV2ray()
	// 执行二进制文件
	cmd := exec.Command(tempPath, "run", "-c", v.ConfigPath)
	// Start starts the specified command but does not wait for it to complete.
	err = cmd.Start()
	if err != nil {
		log.Fatalln("执行失败: " + err.Error() + tempPath)
	}
	v.v2rayCmd = cmd

	v.PacServer.Start()

	return "success"
}

func (v *V2rayCore) Stop() {
	log.Println("-------v2ray stop & reset networksetup-----")
	v.PacServer.Stop()
	v.KillV2ray()
	v.v2rayFilePath = ""
}

func (v *V2rayCore) Restart() string {
	v.Stop()
	log.Printf("\n----- restart ------------\n")
	msg := v.LsofPort()
	if len(msg) > 0 {
		return msg
	}
	v.Start()
	return "success"
}

func (v *V2rayCore) IsPortInUse(port int) bool {
	addr := fmt.Sprintf(":%d", port)
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return true // 端口被占用
	}
	defer listener.Close()
	return false // 端口可用
}

func (v *V2rayCore) LsofPort() string {
	config := v.PacServer.GetFrontConfig()
	ports := []int64{config.HttpPort, config.SocksPort, config.PacPort}

	usedPorts := []string{}
	for _, port := range ports {
		if v.IsPortInUse(int(port)) {
			usedPorts = append(usedPorts, fmt.Sprintf("%d", port))
		}
	}
	if len(usedPorts) > 0 {
		res := strings.Join(usedPorts, ",")
		v.ctx.EmitEvent("lsof:error", res)
		return res
	}
	return ""
}

func (v *V2rayCore) GetConfig() string {
	content, err := os.ReadFile(v.ConfigPath)
	if err != nil {
		return ""
	}
	return string(content)
}

func (v *V2rayCore) SetConfig(config string) {
	err := os.WriteFile(v.ConfigPath, []byte(config), 0644)
	if err != nil {
		log.Panic(err)
	}
}

func (v *V2rayCore) SaveFrontConfig(config string) {
	os.WriteFile(v.FrontConfigPath, []byte(config), 0644)
}

func (v *V2rayCore) GetFrontConfig() string {
	content, err := os.ReadFile(v.FrontConfigPath)
	if err != nil {
		return ""
	}
	return string(content)
}

func (v *V2rayCore) GetSystemInfo() string {
	type SystemInfo struct {
		AppDir          string
		ConfigPath      string
		FrontConfigPath string
	}
	sysInfo := SystemInfo{
		AppDir:          v.AppDir,
		ConfigPath:      v.ConfigPath,
		FrontConfigPath: v.FrontConfigPath,
	}
	content, err := json.Marshal(sysInfo)
	if err != nil {
		return "{}"
	}
	return string(content)
}

func (v *V2rayCore) CheckIsRun() string {
	// 使用 /bin/sh -c 来执行完整命令
	output, err := exec.Command("/bin/sh", "-c", `ps aux | grep "v2ray-lemon2" | grep -v "grep"`).CombinedOutput()
	if err != nil {
		log.Println(err)
		return ""
	}
	return string(output)
}

func (v *V2rayCore) ClearV2rayLog() {
	content, err := os.ReadFile(v.ConfigPath)
	if err != nil {
		fmt.Printf("Error unmarshalling JSON: %v", err)
		return
	}

	type LogBody struct {
		Access string `json:"access"`
	}

	// 定义一个结构体来映射 JSON 数据
	type Body struct {
		Log LogBody `json:"log"`
	}

	// 解析 JSON 字符串
	var data Body
	err = json.Unmarshal([]byte(string(content)), &data)
	if err != nil {
		fmt.Printf("Error unmarshalling JSON: %v", err)
	}

	// 读取 ["body"]["name"] 的值
	filePath := data.Log.Access

	fmt.Println("filePath:", filePath)

	// 打开文件
	file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE, 0666)
	if err != nil {
		log.Fatalf("Error opening file: %v", err)
	}
	defer file.Close()

	// 清空文件内容
	if err := file.Truncate(0); err != nil {
		log.Fatalf("Error truncating file: %v", err)
	}

	fmt.Println("File content has been cleared.")
}

func (v *V2rayCore) GetLog(path string) string {
	output, err := exec.Command("tail", "-n", "3000", path).CombinedOutput()
	if err != nil {
		log.Println(err)
		return ""
	}

	if time.Now().Second()%20 == 0 {
		// 保留最后指定行，避免日志文件过大
		output, err = exec.Command("tail", "-n", "10000", path).CombinedOutput()
		if err != nil {
			log.Println(err)
			return ""
		}
		os.WriteFile(path, output, 0644)
	}

	return string(output)
}

func (v *V2rayCore) GetV2rayInfo() string {
	if v.v2rayFilePath != "" {
		output, err := exec.Command(v.v2rayFilePath, "version").CombinedOutput()
		if err != nil {
			log.Println(err)
			return ""
		}
		return string(output)
	}
	return ""
}

func (v *V2rayCore) GetNetStats() string {
	if v.v2rayCmd == nil {
		return ""
	}
	id := v.v2rayCmd.Process.Pid
	if id > 0 {
		// 通过nettop监控v2ray进程的流量情况，可通过man nettop查看详细文档
		cmd := exec.Command("nettop", "-p", fmt.Sprintf("%d", id), "-P", "-l", "1", "-d", "-x", "-J", "time,bytes_in,bytes_out")
		res, err := cmd.CombinedOutput()
		if err == nil {
			return string(res)
		} else {
			log.Println("nettop exec fail", err)
		}
	}
	return ""
}
