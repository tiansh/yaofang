/**
 * 基本上没有用户会对兴趣推荐感兴趣
 * 而且兴趣推荐会在没有明确提示用户的情况下关注一批账号
 * 用户在操作时甚至不会被提示将会关注账号，以及会关注哪些账号
 * 因此这个脚本试图屏蔽该页面，且不会提供任何设置
 */
; (function () {

  const browser = window.weBrowser;
  let counter = 0;
  browser.webRequest.onBeforeRequest.addListener(details => {
    // 如果连续跳转到这页，那么说明可能跳转并不奏效
    // 避免继续跳转造成无限跳转
    if (++counter > 5) return {};
    setTimeout(() => { counter = 0; }, 10e3);
    return { redirectUrl: new URL('/home', details.url).href };
  }, {
    urls: [
      '*://weibo.com/nguide/*',
      '*://www.weibo.com/nguide/*',
    ],
    types: ['main_frame'],
  }, ['blocking']);

}());
