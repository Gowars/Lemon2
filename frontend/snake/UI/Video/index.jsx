import React, { Component } from 'react';
import S from './index.module.scss';

export default class VideoView extends Component {
    static defaultProps = {
        src: '',
    };

    state = {
        full: false,
        duration: 0,
    };

    componentDidMount() {
        const { $video } = this;
        $video.addEventListener('click', () => {
            if ($video.paused) {
                $video.play();
            } else {
                $video.pause();
            }
        });

        $video.addEventListener('ended', () => {
            this.exitFullscreen($video);
        });

        $video.addEventListener('durationchange', () => {
            // eslint-disable-next-line react/no-direct-mutation-state
            this.state.duration = $video.duration;
            this.updateCurrent();
        });

        $video.addEventListener('timeupdate', this.updateCurrent);
    }

    handleProgress = (event) => {
        const { left, width } = event.currentTarget.getBoundingClientRect();
        const { duration } = this.state;
        this.$video.currentTime = ((event.clientX - left) / width) * duration;
        this.updateCurrent();
    };

    updateCurrent = () => {
        const { $prog, $video } = this;
        const { duration } = this.state;
        if (duration > 0) {
            $prog.style.cssText += `; width: ${($video.currentTime / duration) * 100}%;`;
        }
    };

    handleToggle = () => {
        if (this.state.full) {
            this.exitFullscreen(this.$video);
        } else {
            this.requestFullscreen(this.$video);
        }
        // eslint-disable-next-line react/no-direct-mutation-state
        this.state.full = !this.state.full;
    };

    exitFullscreen(video) {
        if (video.webkitExitFullscreen) {
            video.webkitExitFullscreen();
        } else if (video.exitFullscreen) {
            video.exitFullscreen();
        }
    }

    requestFullscreen(video) {
        if (video.webkitEnterFullscreen) {
            return video.webkitEnterFullscreen();
        }
        if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
        } else if (video.requestFullscreen) {
            video.requestFullscreen();
        }
    }

    addVideoAttrs = (v) => {
        if (v) {
            v.setAttribute('webkit-playsinline', '');
            v.setAttribute('playsinline', '');
            v.setAttribute('x5-video-player-type', 'h5');
            this.$video = v;
        }
    };

    render() {
        const { props } = this;

        return (
            <div className={S.videoWrap}>
                <video src={props.src} ref={this.addVideoAttrs} autoPlay preload="auto" />
                <div className={S.info}>
                    <div className={S.progressWrap} onClick={this.handleProgress}>
                        <div className={S.progress} ref={(v) => (this.$prog = v)} />
                    </div>
                    <button className={S.toggle} onClick={this.handleToggle}>
                        full
                    </button>
                </div>
            </div>
        );
    }
}
