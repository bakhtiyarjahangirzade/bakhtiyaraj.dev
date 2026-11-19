// The service stores route points independently of the WebView, including while it is suspended.
const plugin=()=>window.Capacitor?.Plugins?.ShiftTracker;
let tracker;
export const nativeTracker={
 available:()=>!!window.Capacitor?.isNativePlatform?.(),
 get:()=>tracker||(tracker=plugin()),
 async start(id,message,owner){return this.get().start({id,message,owner})},
 async status(){return this.get().status()},
 async stop(){return this.get().stop()},
 async clear(){return this.get().clear()}
};
