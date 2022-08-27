// main.js：Electron的主进程
// 控制应用生命周期和创建原生浏览器窗口的模组
const { app, shell, BrowserWindow, Menu } = require('electron')
// 处理路径信息的path
const path = require('path')
// Node开发者模式
const NODE_ENV = process.env.NODE_ENV

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 800,
    // 渲染首选项
    webPreferences: {
      // 预加载
      preload: path.join(__dirname, 'preload.js'),
      // 关闭网站安全检查
      webSecurity: false,
      // 开启node
      nodeIntegration: true,
      // 关闭上下文隔离 
      contextIsolation: false,
      // 开启remote
      enableRemoteModule: true,
    }
  });

  // 主进程监听器
  const { ipcMain } = require("electron");
  ipcMain.on("needFilePath", (event, data) => {
    console.log("收到路径请求");
    // 打开dialog，选择目录
    const { dialog } = require('electron')
    dialog.showOpenDialog({
      properties: ['openDirectory'],
    }).then((data) => {
      // 选择目录后，默认创建“新建VueMarkdown.md”
      filePath = data.filePaths.toString() + '\\新建VueMarkdown.md';
      console.log(filePath);
      // 向主进程发送needFilePath完成后续功能
      mainWindow.webContents.send("needFilePath", filePath);
    });
  })

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
          label: '新建窗口', accelerator: "ctrl+shift+n", click: () => {
            console.log("新建窗口");
            newwin = new BrowserWindow({
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
              },
              parent: mainWindow, //win是主窗口
            })
            newwin.loadURL(
              NODE_ENV === 'development'
                ? 'http://localhost:3000'
                : `file://${path.join(__dirname, '../dist/index.html')}`
            ); //new.html是新开窗口的渲染进程
            newwin.on('closed', () => { newwin = null })
          }
        },
        {
          label: '打开', accelerator: "ctrl+o", click: () => {
            console.log("打开文件");
            // // 调用Vue里面的openFile
            // mainWindow.webContents.send("openFile");
            // Electron用dialog实现打开文件
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
          }
        },
        {
          type: "separator"
        },
        {
          label: '保存', accelerator: "ctrl+s", click: () => {
            console.log("保存文件");
            mainWindow.webContents.send("saveFile");
          }
        },
        {
          label: '另存为…', accelerator: "ctrl+shift+s", click: () => {
            console.log("另存文件")
            mainWindow.webContents.send("saveAsFile");
          }
        },
        {
          type: "separator"
        },
        {
          label: '关闭', accelerator: "ctrl+w", click: () => {
            console.log("关闭");
            mainWindow.close();
          }
        },
      ]
    },
    {
      label: "编辑",
      submenu: [
        // role按角色进行配置
        { label: "撤销", role: "undo", click: () => { console.log("撤销操作") } },
        { label: "重做", role: "redo", click: () => { console.log("重做操作") } },
        {
          type: "separator"
        },
        { label: "剪切", role: "cut", click: () => { console.log("剪切操作") } },
        { label: "复制", role: "copy", click: () => { console.log("复制操作") } },
        { label: "粘贴", role: "paste", click: () => { console.log("粘贴操作") } },
        {
          type: "separator"
        },
        { label: "全选", role: "selectall", click: () => { console.log("全选操作") } },
        {
          type: "separator"
        },
        { label: "删除", role: "delete", click: () => { console.log("删除操作") } },
      ]
    },
    {
      label: "视图",
      submenu: [
        {
          label: "全屏", accelerator: "f11", click: () => {
            console.log("全屏");
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
        {
          type: "separator"
        },
        {
          label: "重置页面", click: () => {
            console.log("重置页面");
            mainWindow.webContents.reload()
          },
        },
        {
          label: "开发者工具", accelerator: "shift+f12", click: () => {
            console.log("开发者工具");
            mainWindow.toggleDevTools();
          }
        },
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
        {
          label: "许可证…", click: () => {
            console.log("许可证");
            shell.openExternal('https://raw.githubusercontent.com/Direct5dom/vue-markdown/main/LICENSE');
          }
        },
      ]
    },
  ];
  // 构建菜单模板
  var menuBuilder = Menu.buildFromTemplate(menuTemplate);
  // 设置菜单模板为当前应用的菜单
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