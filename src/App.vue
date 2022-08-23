<script>
import { marked } from 'marked'
import { debounce } from 'lodash-es'

const fs = require("fs")

export default {
  data() {
    return {
      // 同步滚动切换左右的 flag
      flag: false
    }
  },
  data: () => ({
    // 启动后默认显示的内容
    input: ''
  }),
  computed: {
    // 将 input 的内容 marked，并作为 output
    output() {
      return marked(this.input)
    }
  },
  mounted() {
    // 将Vue方法传到全局对象 window 中，使其全局可以调用
    window.openRealPath = this.openRealPath;
    window.newFile = this.newFile;
    // window.openFile = this.openFile;
    window.InitEditor = this.InitEditor;

    // 渲染进程接收主进程消息
    const { ipcRenderer } = require("electron");

    // 需要路径的监听
    ipcRenderer.on("needFilePath", (event, data) => {
      console.log("传入的data：", data);
      // 将文件地址存储于 input 元素
      document.getElementById('input').value = data;
      console.log("路径确定: ", document.getElementById('input').value);
      // 直接写入文件
      // 获取textarea文本内容
      let textMarkdown = document.getElementsByClassName('input')[0].value;
      // 获取当前打开文件地址
      let markdownPath = document.getElementById('input').value;
      console.log(textMarkdown);
      fs.writeFile(markdownPath, textMarkdown, error => {
        if (error) return console.log("写入文件失败，原因是" + error.message);
        else
          console.log("写入成功");
      })
    })
    // 新建文件
    ipcRenderer.on("newFile", (event) => {
      newFile();
    });
    // // 调用 Vue 打开文件
    // ipcRenderer.on("openFile", (event) => {
    //   openFile();
    // });
    // 使用 Electron 打开文件
    ipcRenderer.on("openFilePath", (event, data) => {
      console.log(data);
      // 清理的原因是防止监听函数失效
      // 清空文件地址
      document.getElementById('input').value = null;
      // 清空 open 元素，否则打开文件的监听无法正常运行
      document.getElementById('open').value = null;
      // 将文件地址存储于 input 元素
      document.getElementById('input').value = data;
      console.log("路径确定: ", document.getElementById('input').value);
      // 根据路径打开文件
      this.input = this.readFile(data);
      console.log("文件地址：", data);
    });
    // 保存文件
    ipcRenderer.on("saveFile", (event) => {
      // 获取textarea文本内容
      let textMarkdown = document.getElementsByClassName('input')[0].value;
      // 获取当前打开文件地址
      let markdownPath = document.getElementById('input').value;
      console.log(textMarkdown);
      // 写入本地文件
      // 无路径的情况
      if (markdownPath == '') {
        console.log('目录为空，需要确定目录')
        // 向主进程发送请求
        const { ipcRenderer } = require("electron");
        ipcRenderer.send("needFilePath");
      }
      // 有路径的情况
      else
        // 直接写入文件
        fs.writeFile(markdownPath, textMarkdown, error => {
          if (error) return console.log("写入文件失败，原因是" + error.message);
          else
            console.log("写入成功");
        })
    });
    // 另存文件
    ipcRenderer.on("saveAsFile", (event) => {
      // 获取textarea文本内容
      let textMarkdown = document.getElementsByClassName('input')[0].value;
      // 获取当前打开文件地址
      let markdownPath = document.getElementById('input').value;
      console.log(textMarkdown);
      // 写入本地文件
      // 无路径的情况
      console.log('另存文件，需要确定目录')
      // 向主进程发送请求
      const { ipcRenderer } = require("electron");
      ipcRenderer.send("needFilePath");

    });
    ipcRenderer.on("InitEditor", (event) => {
      InitEditor();
    });
  },
  methods: {
    // 更新方法，每次 input 变动都会引起 output 的更新。
    update: debounce(function (e) {
      this.input = e.target.value
    }, 100),
    // readFile，解析 md 文件内容
    readFile(filePath) {
      // 创建一个新的 xhr 对象
      let xhr = null, okStatus = document.location.protocol === 'file' ? 0 : 200
      xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP')
      xhr.open('GET', filePath, false)
      xhr.overrideMimeType('text/html;charset=utf-8')
      xhr.send(null)
      return xhr.status === okStatus ? xhr.responseText : null
    },
    // newFile，新建文件
    newFile: function () {
      // 清空文件地址
      document.getElementById('input').value = null;
      // 清空 open 元素，否则打开文件的监听无法正常运行
      document.getElementById('open').value = null;
      console.log("input: ", this.input);
      // 清空 input
      this.input = '';
      console.log("文件地址：", document.getElementById('input').value);
    },
    // // openFile，打开文件
    // openFile: function () {
    //   // 清理的原因是防止监听函数失效
    //   // 清空文件地址
    //   document.getElementById('input').value = null;
    //   // 清空 open 元素，否则打开文件的监听无法正常运行
    //   document.getElementById('open').value = null;
    //   console.log("input: ", this.input);
    //   // 创建一个 open 变量，用于存储"open"的元素
    //   var open = document.getElementById("open");
    //   // 点击事件，打开选择文件窗口
    //   document.getElementById('open').click();
    //   // 监听元素变动，一旦有变动便运行 openRealPath
    //   open.addEventListener('change', openRealPath);
    //   console.log("执行操作：打开文件")
    // },
    // openRealPath，打开真实地址的文件
    openRealPath: function () {
      // 储存文件地址
      document.getElementById('input').value = document.getElementById('open').files[0].path;
      // 用 readFile 读取新目录下的 md 文件，然后替换 input 的内容
      this.input = this.readFile(document.getElementById('open').files[0].path);
      console.log("文件地址：", document.getElementById('open').files[0].path);
    },
    // 左右滚动条滚动同步
    changeFlag(flag) {
      this.flag = flag;
      // console.log("flag变动：", flag);
    },
    leftHandleScroll() {
      // 用内容高度减去容器高度
      let rHeight = this.$refs.rightCont.scrollHeight - this.$refs.rightCont.clientHeight
      let lHeight = this.$refs.leftCont.scrollHeight - this.$refs.leftCont.clientHeight
      // 计算百分比
      let proportionH = rHeight / lHeight;
      if (!this.flag) {
        // 按百分比计算右侧移动
        this.$refs.rightCont.scrollTop = (this.$refs.leftCont.scrollTop * proportionH);
      }
    },
    rightHandleScroll() {
      // 用内容高度减去容器高度
      let rHeight = this.$refs.rightCont.scrollHeight - this.$refs.rightCont.clientHeight
      let lHeight = this.$refs.leftCont.scrollHeight - this.$refs.leftCont.clientHeight
      // 计算百分比
      let proportionH = rHeight / lHeight;
      if (this.flag) {
        // 按百分比计算左侧移动
        this.$refs.leftCont.scrollTop = (this.$refs.rightCont.scrollTop / proportionH);
      }
    }
  },
}
</script>

<template>
  <!-- input textatra 暂存信息 -->
  <el-input id="input" type="textarea" :autosize="{ minRows: 1, maxRows: 1 }" placeholder="文件目录" v-model="textarea"
    style="display:none">
  </el-input>
  <!-- 这里的 accept=".md" 可以确保上传文件为 Markdown 文件 -->
  <input id="open" type="file" accept=".md" name="filename" style="display:none" />
  <!-- Editor 主体，包含 input 和 output -->
  <div class="editor">
    <!-- 通过ref属性来操控两个div的scrollTop属性，结合 JS 来实现同步滚动 -->
    <textarea class="input" :value="input" @input="update" ref="leftCont" @scroll="leftHandleScroll()"
      @mouseover="changeFlag(false)"></textarea>
    <div class="output" v-html="output" ref='rightCont' @scroll="rightHandleScroll()" @mouseover="changeFlag(true)">
    </div>
  </div>
</template>