# 此目录用来放各种和业务无关的自己造的库

通过指定package type=module，以达到通过 test.js文件来测试es module写的代码的目的

目录为什么不能放到client之外，因为babel/node/webpack的逻辑是在当前文件的父级寻找配置和依赖
脱离client就要求其内容是无需编译的内容


做一个简单的隔离
包含了react部分，放在UI中，packages作为纯js逻辑，无react依赖
