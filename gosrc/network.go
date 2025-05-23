package gosrc

import (
	"os/exec"
)

type NetworkSetup struct {
	path      string
	name      string
	IP        string
	HttpPort  string
	SocksPort string
}

/**

# 启动代理
enable_proxy() {
    sudo networksetup -setwebproxystate $networkservice on
    sudo networksetup -setsecurewebproxystate $networkservice on
    sudo networksetup -setsocksfirewallproxystate $networkservice on
    scutil --proxy
}

# 停止代理
disable_proxy() {
    sudo networksetup -setwebproxystate $networkservice off
    sudo networksetup -setsecurewebproxystate $networkservice off
    sudo networksetup -setsocksfirewallproxystate $networkservice off
    scutil --proxy
}
*/

// NewApp creates a new App application struct
func NewNetworkSetup() *NetworkSetup {
	return &NetworkSetup{
		path:      "/usr/sbin/networksetup",
		name:      "Wi-Fi",
		IP:        "127.0.0.1",
		HttpPort:  "1087",
		SocksPort: "7890",
	}
}

// func (v *NetworkSetup) Set() {
// 	exec.Command(v.path, "-setwebproxystate", v.name, v.IP, v.HttpPort).Run()
// 	exec.Command(v.path, "-setsecurewebproxystate", v.name, v.IP, v.HttpPort).Run()
// 	exec.Command(v.path, "-setsocksfirewallproxystate", v.name, v.IP, v.SocksPort).Run()
// }

func (v *NetworkSetup) GetState() string {
	content, err := exec.Command("scutil", "--proxy").CombinedOutput()
	if err == nil {
		return ""
	}
	return string(content)
}

func (v *NetworkSetup) EnableGlobalProxy() {
	exec.Command(v.path, "-setwebproxystate", v.name, "on").Run()
	exec.Command(v.path, "-setsecurewebproxystate", v.name, "on").Run()
	exec.Command(v.path, "-setsocksfirewallproxystate", v.name, "on").Run()
}

func (v *NetworkSetup) DisableGlobalProxy() {
	exec.Command(v.path, "-setwebproxystate", v.name, "off").Run()
	exec.Command(v.path, "-setsecurewebproxystate", v.name, "off").Run()
	exec.Command(v.path, "-setsocksfirewallproxystate", v.name, "off").Run()
}

func (v *NetworkSetup) SetPacUrl(url string) {
	exec.Command(v.path, "-setautoproxyurl", v.name, url).Run()
	exec.Command(v.path, "-setautoproxystate", v.name, "on").Run()
}

func (v *NetworkSetup) ClearPacUrl() {
	exec.Command(v.path, "-setautoproxystate", v.name, "off").Run()
	exec.Command(v.path, "-setautoproxystate", v.name, "(null)").Run()
}
