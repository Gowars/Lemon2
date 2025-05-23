// https://caniuse.com/?search=webgl
// https://gist.github.com/cvan/042b2448fcecefafbb6a91469484cdf8
export function getGPU() {
    const canvas = document.createElement('canvas');
    let gl;

    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) {
        //
    }

    if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return {
            debugInfo,
            vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
            renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
        };
    }
    return {
        vendor: '',
        renderer: '',
    };
}

/*
Using Android Phone (Samsung S10e) I got:

vendor: Google Inc. (ARM)
renderer: ANGLE (ARM, Mali-G76, OpenGL ES 3.2)
On Windows 11 (Acer Aspire A315-56, Intel i3-1005G1 CPU) I got:

vendor: Google Inc. (Intel)
renderer: ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)

{
  debugInfo: {
    UNMASKED_RENDERER_WEBGL: 37446,
    UNMASKED_VENDOR_WEBGL: 37445
  },
  renderer: "ANGLE (Apple, Apple M1 Pro, OpenGL 4.1)",
  vendor: "Google Inc. (Apple)"
}
  */
