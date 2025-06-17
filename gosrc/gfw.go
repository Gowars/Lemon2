package gosrc

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"strings"
)

// 初始化规则结构体
type GfwServer struct {
}

func CreateGfwServer() *GfwServer {
	return &GfwServer{}
}

func (g *GfwServer) HandleGFW(bodyString string) {
	WriteRootFile("gfw.txt", bodyString)
}

func (g *GfwServer) ReadGFW() string {
	value, err := os.ReadFile(CreateRootPath("gfw.txt"))
	if err != nil {
		return ""
	}
	return string(value)
}

func (g *GfwServer) parseArr(jsonStr string) []string {
	var arr []string
	err := json.Unmarshal([]byte(jsonStr), &arr)
	if err != nil {
		fmt.Println("parse Arr error")
	}
	return arr
}

func (g *GfwServer) encodeArr(jsonStr []string) string {
	res, err := json.MarshalIndent(jsonStr, "", "  ")
	if err != nil {
		return ""
	}
	return string(res)
}

func (g *GfwServer) ParseGFW(proxyRules string, directRules string) (string, string) {
	dRules := g.parseArr(directRules)
	pRules := g.parseArr(proxyRules)

	// 编译正则表达式，以便在循环中高效使用
	// JS regex /^@+\|+/g 对应 Go regex `^@+\\|+` (需要转义 |)
	// JS regex /^\|+/g 对应 Go regex `^\\|+` (需要转义 |)
	directReplaceRegex := regexp.MustCompile(`^@+\|+`)
	// proxyReplaceRegex := regexp.MustCompile(`^\|+`)˜

	// 3. 按行分割并解析规则
	lines := strings.Split(g.ReadGFW(), "\n")
	for _, line := range lines {
		item := strings.TrimSpace(line) // 去除首尾空白

		// 5. 忽略空行和以 ! 或 [ 开头的行
		if item == "" || strings.HasPrefix(item, "!") || strings.HasPrefix(item, "[") {
			continue // 跳过当前循环项
		}

		// 6. 判断并处理规则类型
		if strings.HasPrefix(item, "@@") {
			// 例外规则 (direct)
			// 移除开头的 @@ 和其后的 |
			// JS: item.replace(/^@+\|+/g, '')
			// 使用编译好的正则表达式进行替换
			cleanedItem := directReplaceRegex.ReplaceAllString(item, "")
			dRules = append(dRules, cleanedItem) // 添加到 direct 列表
		} else {
			pRules = append(pRules, item) // 添加到 proxy 列表
		}
	}

	return g.encodeArr(pRules), g.encodeArr(dRules)
}

type IEventData struct {
	ID   string `json:"id"`
	Body string `json:"body"`
}

func DecodeEventData(value string) IEventData {
	// 定义目标变量
	var v IEventData

	// 解码 JSON
	err := json.Unmarshal([]byte(value), &v)
	if err != nil {
		fmt.Println("解码失败:", err)
	}
	return v
}
