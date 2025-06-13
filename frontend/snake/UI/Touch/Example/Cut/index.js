import rotate from '@/snake/UI/Touch/Example/Cut/rotate';
import { Modal } from '@/snake/main';

import cutImg from './cutImg';

import Pinch from '../../Pinch';
import S from './index.module.scss';

export default function Cut(url, { width = 100, height = width, zIndex = 10002 } = {}) {
    return new Promise((res) => {
        // 处理旋转图片
        if (url.size) {
            rotate(url).then((file) => {
                url = URL.createObjectURL(file);
                res(url);
            });
        } else {
            res(url);
        }
    }).then(
        (url) =>
            new Promise((resolve) => {
                Modal.open(
                    `<div class="${S.wrap} pageTouchIgnore" style="z-index: ${zIndex}">
                <div style="position: relative; max-width: 7.5rem; margin: 0 auto; height: 100%;">
                    <div class="${S.event}">
                        <div class="${S.transform}">
                            <div class="${S.item}">
                                <div class="${S.imgWrap}">
                                    <img class="${S.img}" src="${url}"/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="select ${S.select}" style="padding-top: ${(height / width) * 100}%;"></div>
                    <button class="${S.save} mr10">保存</button>
                    <button class="${S.rotate}">旋转</button>
                    <button class="modal-close ${S.close}">取消</button>
                </div>
            </div>`,
                    {
                        fullScreen: true,
                        animation: false,
                        onShow(div, closeModal) {
                            const selectRect = div.querySelector(`.${S.select}`).getBoundingClientRect();
                            const pinch = new Pinch(div.querySelector(`.${S.event}`), div.querySelector('img'), {
                                $borderCheckDom: div.querySelector(`.${S.select}`),
                                disableBorderCheck: true,
                            });

                            const onClose = () => {
                                // 获取信息
                                const info = {
                                    imgInfo: {
                                        w: pinch.origin.width,
                                        h: pinch.origin.height,
                                        src: url,
                                    },
                                    cut: {
                                        x: pinch.origin.left - selectRect.left, // 图片相对select的坐标
                                        y: pinch.origin.top - selectRect.top,
                                        w: selectRect.width,
                                        h: selectRect.height,
                                    },
                                    scale: width / div.querySelector(`.${S.event}`).clientWidth && 1,
                                    state: pinch.trans.state,
                                };
                                // 去剪切图片
                                cutImg(info)
                                    .then((result) => {
                                        resolve(result.file);
                                    })
                                    .catch((err) => console.error(err));

                                closeModal();
                            };

                            div.querySelector(`.${S.save}`).addEventListener('click', onClose);
                            div.querySelector(`.${S.rotate}`).addEventListener('click', () => {
                                pinch.rotate(Math.PI / 2);
                            });
                        },
                    }
                );
            })
    );
}
