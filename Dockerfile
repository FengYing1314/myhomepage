FROM nginx:alpine

# 复制构建好的静态文件
COPY dist/ /usr/share/nginx/html/

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 555 端口
EXPOSE 555

CMD ["nginx", "-g", "daemon off;"]
