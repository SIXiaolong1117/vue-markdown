<script>
import { marked } from 'marked'
import { debounce } from 'lodash-es'

const fs = require("fs")
// 渲染进程接收主进程消息
const { ipcRenderer } = require("electron");

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
    window.newFile = this.newFile;
    window.openFile = this.openFile;
    window.saveFile = this.saveFile;
    window.saveAsFile = this.saveAsFile;
    window.needFilePath = this.needFilePath;

    // 需要路径
    ipcRenderer.on("needFilePath", (event, data) => {
      console.log("主进程传入data：", data);
      // 调用需要路径方法
      needFilePath(data);
      // 调用保存方法
      saveFile();
    })

    // 新建文件
    ipcRenderer.on("newFile", (event) => {
      newFile();
    });
    // 使用Electron的dialog+ipc通信打开文件
    ipcRenderer.on("openFilePath", (event, data) => {
      console.log("主进程传入data：" + data);
      openFile(data);
    });
    // 保存文件
    ipcRenderer.on("saveFile", (event) => {
      saveFile();
    });
    // 另存文件
    ipcRenderer.on("saveAsFile", (event) => {
      saveAsFile();
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
    // needFilePath，需要路径
    needFilePath(dataPath) {
      // 将文件地址存储于input元素
      document.getElementById('input').value = dataPath;
      console.log("路径确定: ", document.getElementById('input').value);
    },
    // newFile，新建文件
    newFile: function () {
      // 预防性清空input中储存的文件地址
      document.getElementById('input').value = null;
      console.log("input元素中的路径确定: ", document.getElementById('input').value);
      // 清空Editor中input的内容
      this.input = '';
      console.log("Editor中input内容确定: ", this.input);
    },
    // openFile，打开文件
    openFile(dataPath) {
      // 预防性清空input中储存的文件地址
      document.getElementById('input').value = null;
      // 将文件地址存储于 input 元素，方便其他功能调用
      document.getElementById('input').value = dataPath;
      console.log("input元素中的路径确定: ", document.getElementById('input').value);
      // 根据路径打开文件
      this.input = this.readFile(dataPath);
      console.log("当前打开文件的地址：", dataPath);
    },
    saveFile: function () {
      // let变量，防止错误的修改这些东西
      let textMarkdown = document.getElementsByClassName('input')[0].value;
      let markdownPath = document.getElementById('input').value;
      // 写入本地文件
      // 无路径的情况
      if (markdownPath == '') {
        console.log('目录为空，需要确定目录')
        // 向主进程发送请求
        ipcRenderer.send("needFilePath");
      }
      // 有路径的情况
      else
        // 直接写入文件
        fs.writeFile(markdownPath, textMarkdown, error => {
          if (error) return console.log("写入文件失败，原因是" + error.message);
          else
            console.log("写入成功，写入内容为：" + textMarkdown);
        })
    },
    saveAsFile: function () {
      console.log('另存文件，需要确定目录')
      // 向主进程发送需要路径请求
      ipcRenderer.send("needFilePath");
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
  <textarea id="input" style="display:none">
  </textarea>
  <!-- Editor 主体，包含 input 和 output -->
  <div class="editor">
    <!-- 通过ref属性来操控两个div的scrollTop属性，结合 JS 来实现同步滚动 -->
    <textarea class="input" :value="input" @input="update" ref="leftCont" @scroll="leftHandleScroll()"
      @mouseover="changeFlag(false)"></textarea>
    <div class="output" v-html="output" ref='rightCont' @scroll="rightHandleScroll()" @mouseover="changeFlag(true)">
    </div>
  </div>
</template>