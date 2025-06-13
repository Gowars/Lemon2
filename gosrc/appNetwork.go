package gosrc

import "os"

func GetAppNetworkConfig() string {
	value, err := os.ReadFile(CreateRootPath("application.route.json"))
	if err != nil {
		return ""
	}
	return string(value)
}

func SetAppNetworkConfig(content string) {
	WriteRootFile("application.route.json", content)
}
