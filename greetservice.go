package main

import (
	"changeme/gosrc"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/wailsapp/wails/v3/pkg/application"
)

func getFirstUpperChar(s string) string {
	// 检查字符串是否为空
	if s == "" {
		return s
	}

	// 获取第一个字符（考虑 UTF-8 编码）
	r, _ := utf8.DecodeRuneInString(s)
	if r == utf8.RuneError {
		return "" // 如果解码失败，返回原字符串
	}

	// 将第一个字符转为大写，并拼接剩余部分
	return strings.ToUpper(string(r))
}

// App struct
type GreetService struct {
	ctx        *application.App
	v2rayCore  *gosrc.V2rayCore
	systemTray *application.SystemTray
	pacServer  *gosrc.PacServer
	mode       string
}

// NewApp creates a new App application struct
func NewApp() *GreetService {
	return &GreetService{}
}

// startup is called at application startup
func (a *GreetService) startup(ctx *application.App) {
	// Perform your setup here
	a.ctx = ctx
	pacServer := gosrc.NewPacServer()
	a.v2rayCore = gosrc.NewV2rayCore(assets, pacServer, ctx)

	a.ctx.OnEvent("handle-gfw", func(event *application.CustomEvent) {
		data := fmt.Sprintf("%v", event.Data)
		res := gosrc.DecodeEventData(data)
		gosrc.CreateGfwServer().HandleGFW(res.Body)
		a.ctx.EmitEvent(res.ID, "")
	})
}

// shutdown is called at application termination
func (a *GreetService) shutdown() {
	// Perform your teardown here
	a.v2rayCore.Stop()
}

// startup is called at application startup
func (a *GreetService) setSystray(ctx *application.SystemTray) {
	// Perform your setup here
	a.systemTray = ctx
	a.toggleLable(true)
}

func (a *GreetService) toggleLable(enable bool) {
	iconName := "lemon.off.systray.png"
	if enable {
		iconName = "lemon.systray.png"
		// a.systemTray.SetLabel("🍋")
		char := getFirstUpperChar(a.mode)
		if char != "" {
			iconName = "lemon.systray." + char + ".png"
		}
	}
	iconData, err := assets.ReadFile("frontend/dist/" + iconName)
	if err != nil {
		panic("无法读取图标文件: " + err.Error())
	}
	// macOS 支持 模板图标，可以简化深色/浅色模式适配。模板图标是单色图像（通常为黑色，带透明背景），
	// macOS 会根据主题自动调整其颜色（深色模式下变白，浅色模式下保持黑）。
	a.systemTray.SetTemplateIcon(iconData)
}

// Greet returns a greeting for the given name
func (a *GreetService) Greet(name string) string {
	req := decodeBridge(name)
	log.Println("name::", req.Type)
	switch req.Type {
	case "pac-mode-change":
		{
			a.v2rayCore.PacServer.SetStatus(req.Data)
			a.mode = req.Data
			if req.Data == "off" {
				a.toggleLable(false)
				a.v2rayCore.Stop()
			} else {
				a.toggleLable(true)
				return a.v2rayCore.Restart()
			}
		}
	case "get-config":
		{
			return a.v2rayCore.GetConfig()
		}
	case "check-is-run":
		{
			res := a.v2rayCore.CheckIsRun()
			a.toggleLable(len(res) > 0)
			return res
		}
	case "fetch":
		{
			return a.RequestForFront(req.Data)
		}
	case "set-config":
		{
			a.v2rayCore.SetConfig(req.Data)
			return "success"
		}
	case "save-front-config":
		{
			a.v2rayCore.SaveFrontConfig(req.Data)
			return "success"
		}
	case "get-front-config":
		{
			return a.v2rayCore.GetFrontConfig()
		}
	case "clear-v2ray-log":
		{
			a.v2rayCore.ClearV2rayLog()
			return "success"
		}
	case "get-local-ip":
		{
			return gosrc.GetLocalIP()
		}
	case "ping":
		{
			a.PingIP(req.Data)
			return "success"
		}
	case "get-system-info":
		{
			return a.v2rayCore.GetSystemInfo()
		}
	case "get-log":
		{
			return a.v2rayCore.GetLog(req.Data)
		}
	case "get-vray-info":
		{
			return a.v2rayCore.GetV2rayInfo()
		}
	case "get-pac-content":
		{
			return a.pacServer.GetPacContent()
		}
	case "get-net-stats":
		{
			return a.v2rayCore.GetNetStats()
		}
	case "open-url":
		{
			exec.Command("open", req.Data).CombinedOutput()
			return "success"
		}
	case "lsof":
		{
			port, err := strconv.Atoi(req.Data)
			if err != nil {
				return "Error fomart"
			}
			if a.v2rayCore.IsPortInUse(port) {
				return "false"
			}
			return "success"
		}
	case "get-app-info":
		{
			return gosrc.GetAppNetworkConfig()
		}
	case "set-app-info":
		{
			gosrc.SetAppNetworkConfig(req.Data)
			return "success"
		}
	default:
		{
			return fmt.Sprintf("canot handle type: %s", req.Type)
		}
	}

	return "success"
}

type BridgeData struct {
	Type string `json:"type"`
	Data string `json:"data"`
}

func decodeBridge(value string) BridgeData {
	// 定义目标变量
	var v BridgeData

	// 解码 JSON
	err := json.Unmarshal([]byte(value), &v)
	if err != nil {
		fmt.Println("解码失败:", err)
	}
	return v
}

func (a *GreetService) RequestForFront(url string) string {
	go func() {
		type Req struct {
			Url string `json:"url"`
			ID  string `json:"id"`
		}
		var d Req
		json.Unmarshal([]byte(url), &d)
		// 模拟网络请求
		// 模拟读取响应（这里可以根据需要处理 body）
		result := map[string]interface{}{
			"url":  d.Url,
			"body": gosrc.Request(d.Url),
		}

		// 通过事件将结果发送给前端
		a.ctx.EmitEvent(d.ID, result)
	}()
	return ""
}

func runPing(ip string) string {
	pingTime := ""
	// ping设置超时
	cmd := exec.Command("ping", "-W", "3", "-c", "1", ip)
	output, err := cmd.Output()
	if err != nil {
		fmt.Println("执行 ping 命令失败:", err)
		return pingTime
	}

	// 输出示例：64 bytes from 142.250.184.132: icmp_seq=0 ttl=117 time=23.456 ms
	re := regexp.MustCompile(`time=([\d\.]+)\s*ms`)
	matches := re.FindStringSubmatch(string(output))
	if len(matches) > 1 {
		pingTime = matches[1]
	}
	return pingTime
}

func runNetcat(ip string, port string) string {
	pingTime := ""
	// netcat
	start := time.Now().UnixMilli()
	cmd := exec.Command("nc", "-w", "2", "-z", ip, port)
	_, err := cmd.Output()
	if err != nil {
		fmt.Println("执行 nc 命令失败:", err)
		return pingTime
	}
	end := time.Now().UnixMilli() - start
	if end < 2000 {
		pingTime = fmt.Sprintf("%d", end)
	}
	return pingTime
}

func (a *GreetService) PingIP(ips string) string {
	arr := strings.Split(ips, ",")
	for _, ip := range arr {
		go func() {
			if !strings.Contains(ip, ":") {
				return
			}
			arr := strings.Split(ip, ":")
			if len(arr) == 0 {
				return
			}
			ip = arr[0]
			// TODO: 严格来讲，应当使用netcat作为ping的结果比较合适
			// 因为ping不能指定port
			pingTime := runPing(ip)
			if len(pingTime) == 0 && len(arr) > 1 {
				port := arr[1]
				pingTime = runNetcat(ip, port)
			}

			fmt.Println(ip, "耗时:", pingTime, "ms")
			type Res struct {
				IP   string `json:"ip"`
				Time string `json:"time"`
			}
			res := Res{
				IP:   ip,
				Time: pingTime,
			}
			jsonData, err := json.Marshal(res)
			if err != nil {
				fmt.Println("Error:", err)
				return
			}

			a.ctx.EmitEvent("ping:response", string(jsonData))
		}()
	}

	return ""
}
