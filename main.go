package main

import (
	"embed"
	_ "embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

// Wails uses Go's `embed` package to embed the frontend files into the binary.
// Any files in the frontend/dist folder will be embedded into the binary and
// made available to the frontend.
// See https://pkg.go.dev/embed for more information.

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/darwin/icons.icns
var macIcon []byte

// main function serves as the application's entry point. It initializes the application, creates a window,
// and starts a goroutine that emits a time-based event every second. It subsequently runs the application and
// logs any error that might occur.
func main() {
	greetServer := NewApp()
	// Create a new Wails application by providing the necessary options.
	// Variables 'Name' and 'Description' are for application metadata.
	// 'Assets' configures the asset server with the 'FS' variable pointing to the frontend files.
	// 'Bind' is a list of Go struct instances. The frontend has access to the methods of these instances.
	// 'Mac' options tailor the application when running an macOS.
	app := application.New(application.Options{
		Name:        "lemon2",
		Description: "v2ray mac client",
		Services: []application.Service{
			application.NewService(greetServer),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ActivationPolicy: application.ActivationPolicyRegular, // 确保为 Regular
			ApplicationShouldTerminateAfterLastWindowClosed: false,
		},
		Icon: macIcon, // 设置应用icon
		OnShutdown: func() {
			greetServer.shutdown()
		},
	})
	greetServer.startup(app)

	// Create a new window with the necessary options.
	// 'Title' is the title of the window.
	// 'Mac' options tailor the window when running on macOS.
	// 'BackgroundColour' is the background colour of the window.
	// 'URL' is the URL that will be loaded into the webview.
	window := app.NewWebviewWindowWithOptions(application.WebviewWindowOptions{
		Title: "Lemon2",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
		// OpenInspectorOnStartup: true,
	})

	// Listen for the window closing event
	window.OnWindowEvent(events.Common.WindowClosing, func(event *application.WindowEvent) {
		app.Quit()
	})

	// 点击 Dock 时触发的事件
	app.OnApplicationEvent(events.Mac.ApplicationDidBecomeActive, func(event *application.ApplicationEvent) {
		println("--------applicationDidBecomeActive-------")
		if !window.IsVisible() {
			window.Show()
		}
		window.Focus()
	})

	app.OnApplicationEvent(events.Mac.ApplicationWillTerminate, func(event *application.ApplicationEvent) {
		println("--------ApplicationWillTerminate-------")
		greetServer.shutdown()
	})

	systray := app.NewSystemTray()
	systray.OnClick(func() {
		if window.IsFocused() {
			window.Hide()
		} else {
			window.Show()
			window.Focus()
		}
	})
	greetServer.setSystray(systray)

	// Run the application. This blocks until the application has been exited.
	err := app.Run()

	// If an error occurred while running the application, log it and exit.
	if err != nil {
		log.Fatal(err)
	}
}
