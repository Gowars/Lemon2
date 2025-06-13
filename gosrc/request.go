package gosrc

import (
	"io"
	"log"
	"net/http"
)

func Request(url string) string {
	log.Println("正在请求:", url)
	// 发送 GET 请求
	resp, err := http.Get(url)
	if err != nil {
		log.Println("请求失败:", err)
		return ""
	}
	defer resp.Body.Close() // 确保在函数结束时关闭响应体

	// 检查状态码
	if resp.StatusCode != http.StatusOK {
		log.Println("响应状态码不是 200:", resp.Status)
		return ""
	}

	// 读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("读取响应失败:", err)
		return ""
	}

	// 打印响应内容
	log.Println("响应内容:", string(body))

	return string(body)
}
