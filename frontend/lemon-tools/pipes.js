/**
 * [handlePipes 队列化任务，比如上前图片前需要: 旋转 -> 压缩 -> 添加水印
 * @param  {Array}  [pipes=[]]  [description]
 * @param  {Array}  [target=[]] [description]
 * @return {Promise}             [description]
 */
export default function handlePipes(pipes = [], target = []) {
    return new Promise((res, rej) => {
        let index = 0;
        const next = () => {
            if (index >= pipes.length) {
                return res(target);
            }

            return Promise.all(target.map(pipes[index]))
                .then((newTarget) => {
                    index += 1;
                    target = newTarget;
                    next();
                })
                .catch((err) => rej(err));
        };
        next();
    });
}
