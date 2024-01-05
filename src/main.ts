import { createApp } from "vue";
import App from "./App.vue";
import router from './router';
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "~/styles/index.scss";
import "uno.css";
import "element-plus/theme-chalk/src/message.scss";

// Global properties such as 'accounts' should be added to the app instance
const app = createApp(App);

// Use ElementPlus
app.use(ElementPlus);

// Use the router
app.use(router);

// Define global properties or state
app.config.globalProperties.$accounts = [] as { username: string; password: string; }[];

// Mount the application
app.mount("#app");
