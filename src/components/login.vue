<template>
  <div class="center-container">
    <el-card class="box-card">
      <h2>登录</h2>
      <el-form
        :model="ruleForm"
        status-icon
        :rules="rules"
        ref="ruleForm"
        label-position="left"
        label-width="70px"
        class="login-from"
      >
        <el-form-item label="用户名" prop="uname">
          <el-input v-model="ruleForm.uname"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            type="password"
            v-model="ruleForm.password"
            autocomplete="off"
          ></el-input>
        </el-form-item>
      </el-form>
      <div class="btnGroup">
        <el-button type="primary" @click="submitForm('ruleForm')"
          >登录</el-button
        >
        <el-button @click="resetForm('ruleForm')">重置</el-button>
        <el-button @click="register">注册</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      ruleForm: {
        uname: "",
        password: "",
      },
      rules: {
        uname: [
          { required: true, message: "用户名不能为空！", trigger: "blur" },
        ],
        password: [
          { required: true, message: "密码不能为空！", trigger: "blur" },
        ],
      },
    };
  },
  methods: {
    submitForm(formName) {
      this.$refs[formName].validate(async (valid) => {
        if (valid) {
          try {
            // 发送登录请求到后端API
            const response = await axios.post(
              "http://pi.20021123.xyz:3000/api/login",
              {
                username: this.ruleForm.uname,
                password: this.ruleForm.password,
              }
            );
            // 登录成功
            // 假设后端返回的响应中包含了token和用户信息
            const { token, user } = response.data;
            localStorage.setItem("userToken", token);
            // 可以选择存储用户信息，或其他必要的数据
            // localStorage.setItem('userInfo', JSON.stringify(user));
            // 跳转到之前想要访问的页面或默认页面
            const redirect = this.$route.query.redirect || "/digram";
            this.$router.push(redirect);
            this.$message.success("登录成功！");
          } catch (error) {
            if (error.response) {
              // 处理错误响应，例如：错误的用户名或密码
              this.$message.error(error.response.data.message);
            } else {
              // 处理连接到后端时的错误
              this.$message.error("登录失败，请稍后重试。");
            }
          }
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },

    resetForm(formName) {
      this.$refs[formName].resetFields();
    },
    async register() {
      try {
        const response = await axios.post(
          "http://pi.20021123.xyz:3000/api/register",
          {
            username: this.ruleForm.uname,
            password: this.ruleForm.password,
          }
        );
        this.$message.success(response.data.message);
        // 可选：注册后自动登录
        this.$router.push("/digram");
      } catch (error) {
        if (error.response) {
          // 请求已发出，服务器用状态码响应
          this.$message.error(error.response.data.message);
        } else {
          this.$message.error("注册失败！");
        }
      }
    },
  },
};
</script>

<style scoped>
.box-card {
  margin: auto auto;
  width: 400px;
}

.login-from {
  margin: auto auto;
}

.center-container {
  display: grid;
  place-items: center;
  height: 100vh;
  /* 或者你希望的高度 */
}
</style>
