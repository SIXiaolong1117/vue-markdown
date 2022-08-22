// 控制应用生命周期和创建原生浏览器窗口的模组
const { app, shell, BrowserWindow, Menu } = require('electron')
const path = require('path')

const NODE_ENV = process.env.NODE_ENV

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // 关闭网站安全检查
      webSecurity: false,
      // 开启node
      nodeIntegration: true,
      contextIsolation: false,
      // 开启remote
      enableRemoteModule: true,
    }
  });

  // 加载 index.html
  // mainWindow.loadFile('dist/index.html') 将该行改为下面这一行，加载url
  mainWindow.loadURL(
    NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );

  // 打开开发工具
  if (NODE_ENV === "development") {
    mainWindow.webContents.openDevTools()
  };

  // 引入自定义菜单
  // require("../ipcMain/menu.js");
  var menuTemplate = [
    {
      label: "文件",
      submenu: [
        // accelerator 配置快捷键
        {
          label: '新建', accelerator: "ctrl+n", click: () => {
            console.log("新建文件");
            mainWindow.webContents.send("newFile");
          }
        },
        {
          label: '打开', accelerator: "ctrl+o", click: () => {
            console.log("打开文件");
            // mainWindow.webContents.send("openFile");
            // then 等待选择完成
            const { dialog } = require('electron')
            dialog.showOpenDialog({
              properties: ['openFile'],
                filters: [
                  { name: 'Markdown Files', extensions: ['md'] },
                ]
            }).then((data) => {
                console.log(data.filePaths.toString());
                mainWindow.webContents.send("openFilePath", data.filePaths.toString());
              });
          // console.log(dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] }))
        }
        },
    { type: "separator" },
    { label: '保存', accelerator: "ctrl+s", click: () => { console.log("保存文件") } },
    { label: '另存为…', accelerator: "ctrl+alt+s", click: () => { console.log("另存文件") } },
  ]
},
{
  label: "编辑",
    submenu: [
      // role按角色进行配置
      { label: "复制", role: "copy", click: () => { console.log("复制文件") } },
      { label: "粘贴", role: "paste", click: () => { console.log("粘贴文件") } }
    ]
},
{
  label: "帮助",
    submenu: [
      {
        label: "作者…", click: () => {
          console.log("作者页面");
          shell.openExternal('https://github.com/Direct5dom');
        }
      },
    ]
},
{
  label: "调试（开发者模式）",
    submenu: [
      {
        label: "重置页面", click: () => {
          console.log("重置页面");
          mainWindow.webContents.send("InitEditor");
        }
      },
    ]
},
  ];
// 固定写法
var menuBuilder = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menuBuilder);

}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow()

  // // 隐藏菜单栏
  // const { Menu } = require('electron');
  // Menu.setApplicationMenu(null);

  // // 打开文件 diglog
  // const { dialog } = require('electron');
  // console.log(dialog.showOpenDialog({ properties: ['openFile'] }));

  // const { ipcMain } = require("electron");

  // ipcMain.on("sendMessage", (event) => {
  //   event.sender.send("sendMain", "this is a main")
  // })

  app.on('activate', function () {
    // 通常在 macOS 上，当点击 dock 中的应用程序图标时，如果没有其他
    // 打开的窗口，那么程序会重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此，通常对程序和它们在
// 任务栏上的图标来说，应当保持活跃状态，直到用户使用 Cmd + Q 退出。
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// 在这个文件中，你可以包含应用程序剩余的所有部分的代码，
// 也可以拆分成几个文件，然后用 require 导入。