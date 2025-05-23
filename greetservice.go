package main

import (
	"changeme/gosrc"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	"regexp"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// App struct
type GreetService struct {
	ctx        *application.App
	v2rayCore  *gosrc.V2rayCore
	systemTray *application.SystemTray
	pacServer  *gosrc.PacServer
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
	a.v2rayCore = gosrc.NewV2rayCore(assets, pacServer)

	a.ctx.OnEvent("handle-gfw", func(event *application.CustomEvent) {
		data := fmt.Sprintf("%v", event.Data)
		gosrc.CreateGfwServer().HandleGFW(data)
		a.v2rayCore.PacServer.Reload()
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
	if req.Type == "pac-mode-change" {
		if req.Data == "off" {
			a.v2rayCore.Stop()
			a.toggleLable(false)
		} else {
			a.v2rayCore.Start()
			a.toggleLable(true)
		}
		a.v2rayCore.PacServer.SetStatus(req.Data)
	} else if req.Type == "get-config" {
		return a.v2rayCore.GetConfig()
	} else if req.Type == "check-is-run" {
		res := a.v2rayCore.CheckIsRun()
		a.toggleLable(len(res) > 0)
		return res
	} else if req.Type == "fetch" {
		return a.RequestForFront(req.Data)
	} else if req.Type == "set-config" {
		a.v2rayCore.SetConfig(req.Data)
		return "success"
	} else if req.Type == "save-all" {
		a.v2rayCore.SaveFrontConfig(req.Data)
		return "success"
	} else if req.Type == "get-save-all" {
		// return "222"
		return a.v2rayCore.GetFrontConfig()
	} else if req.Type == "clear-v2ray-log" {
		// return "222"
		a.v2rayCore.ClearV2rayLog()
		return "success"
	} else if req.Type == "get-local-ip" {
		return gosrc.GetLocalIP()
	} else if req.Type == "ping" {
		a.PingIP(req.Data)
		return "success"
	} else if req.Type == "get-system-info" {
		return a.v2rayCore.GetSystemInfo()
	} else if req.Type == "get-log" {
		return a.v2rayCore.GetLog(req.Data)
	} else if req.Type == "get-vray-info" {
		return a.v2rayCore.GetV2rayInfo()
	} else if req.Type == "get-pac-content" {
		return a.pacServer.GetPacContent()
	} else if req.Type == "get-v2ray-stats" {
		return a.v2rayCore.GetNetStats()
	} else if req.Type == "open-url" {
		exec.Command("open", req.Data).CombinedOutput()
		return "success"
	}

	return fmt.Sprintf("Hello %s, It's show time!", name)
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

		log.Println("获取接口成功")

		// 通过事件将结果发送给前端
		a.ctx.EmitEvent("fetch-res::"+d.ID, result)
	}()
	return ""
}

func (a *GreetService) PingIP(ips string) string {
	arr := strings.Split(ips, ",")
	for _, ip := range arr {
		go func() {
			cmd := exec.Command("ping", "-c", "1", ip)
			output, err := cmd.Output()
			if err != nil {
				fmt.Println("执行 ping 命令失败:", err)
				return
			}

			// 输出示例：64 bytes from 142.250.184.132: icmp_seq=0 ttl=117 time=23.456 ms
			re := regexp.MustCompile(`time=([\d\.]+)\s*ms`)
			matches := re.FindStringSubmatch(string(output))
			if len(matches) > 1 {
				fmt.Println(ip, "耗时:", matches[1], "ms")
				type Res struct {
					IP   string `json:"ip"`
					Time string `json:"time"`
				}
				res := Res{
					IP:   ip,
					Time: matches[1],
				}
				jsonData, err := json.Marshal(res)
				if err != nil {
					fmt.Println("Error:", err)
					return
				}

				a.ctx.EmitEvent("ping:response", string(jsonData))
			} else {
				fmt.Println("无法解析 ping 输出")
			}
		}()
	}

	return ""
}
