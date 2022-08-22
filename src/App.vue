<script>
import { marked } from 'marked'
import { debounce } from 'lodash-es'

export default {
  data() {
    return {
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
    // // 使用 this.readFile 读取指定目录的文件，并替换 input
    // this.input = this.readFile('../README.md');
    // 将Vue方法传到全局对象 window 中，使 JS 可以调用
    window.openRealPath = this.openRealPath;
    window.openFile = this.openFile;
  },
  methods: {
    // 更新方法，每次 input 变动都会引起 output 的更新。
    update: debounce(function (e) {
      this.input = e.target.value
    }, 100),
    // readFile，解析 md 文件内容
    readFile(filePath) {
      // 创建一个新的xhr对象
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
    // openFile，打开文件
    openFile: function () {
      // 清理的原因是防止监听函数失效
      // 清空文件地址
      document.getElementById('input').value = null;
      // 清空 open 元素，否则打开文件的监听无法正常运行
      document.getElementById('open').value = null;
      console.log("input: ", this.input);
      // 创建一个 open 变量，用于存储"open"的元素
      var open = document.getElementById("open");
      // 点击事件，打开选择文件窗口
      document.getElementById('open').click();
      // 监听元素变动，一旦有变动便运行 openRealPath
      open.addEventListener('change', openRealPath);
      console.log("执行操作：打开文件")
    },
    // openRealPath，打开真实地址的文件
    openRealPath: function () {
      // 储存文件地址
      document.getElementById('input').value = document.getElementById('open').files[0].path;
      // 用 readFile 读取新目录下的 md 文件，然后替换 input 的内容
      this.input = this.readFile(document.getElementById('open').files[0].path);
      console.log("文件地址：", document.getElementById('open').files[0].path);
    },
    saveFile: function () {
      console.log("执行操作：保存文件")
    },
    saveAsFile: function () {
      console.log("执行操作：另存文件")
    },
    // 刷新页面
    InitEditor: function () {
      location.reload()
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
        // console.log('L位置: ', this.$refs.leftCont.scrollTop);
        // console.log('L高度: ', lHeight);
        // console.log('R位置: ', this.$refs.rightCont.scrollTop);
        // console.log('R高度: ', rHeight);
        // console.log('R百分比: ', this.$refs.rightCont.scrollTop / rHeight);
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
        // console.log('R位置: ', this.$refs.rightCont.scrollTop);
        // console.log('R高度: ', rHeight);
        // console.log('L位置: ', this.$refs.leftCont.scrollTop);
        // console.log('L高度: ', lHeight);
        // console.log('L百分比: ', this.$refs.leftCont.scrollTop / lHeight);
      }
    }
  },
}
</script>

<template>
  <nav>
    <!-- 新建文件按钮 -->
    <el-button id="new_button" type="primary" v-on:click="newFile()" round>新建文件</el-button>
    <!-- 打开文件按钮 -->
    <el-button id="input_button" type="primary" v-on:click="openFile()" round>打开文件</el-button>
    <!-- 保存文件按钮 -->
    <el-button id="save_button" type="primary" v-on:click="saveFile()" round>保存文件</el-button>
    <!-- 另存文件按钮 -->
    <el-button id="save_as_button" type="primary" v-on:click="saveAsFile()" round>另存文件</el-button>
    <!-- 刷新按钮（测试用） -->
    <el-button id="save_button" type="primary" v-on:click="InitEditor()" round>重置页面（调试用）</el-button>
    <!-- input textatra 暂存信息 -->
    <el-input id="input" type="textarea" :autosize="{ minRows: 1, maxRows: 1 }" placeholder="文件目录" v-model="textarea"
      style="display:none">
    </el-input>
    <!-- 这里的 accept=".md" 可以确保上传文件为 Markdown 文件 -->
    <input id="open" type="file" accept=".md" name="filename" style="display:none" />
  </nav>
  <!-- Editor 主体，包含 input 和 output -->
  <div class="editor">
    <!-- 通过ref属性来操控两个div的scrollTop属性，结合 JS 来实现同步滚动 -->
    <textarea class="input" :value="input" @input="update" ref="leftCont" @scroll="leftHandleScroll()"
      @mouseover="changeFlag(false)"></textarea>
    <div class="output" v-html="output" ref='rightCont' @scroll="rightHandleScroll()" @mouseover="changeFlag(true)">
    </div>
  </div>
</template>