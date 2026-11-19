package dev.bakhtiyaraj.kuryebro;

import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONObject;

/** Move the former hosted origin's local records without requiring a network connection. */
final class StorageMigration {
    static void run(MainActivity activity){
        android.content.SharedPreferences prefs=activity.getSharedPreferences("migration",0);
        if(prefs.getBoolean("localOriginV1",false))return;
        WebView old=new WebView(activity);old.getSettings().setJavaScriptEnabled(true);old.getSettings().setDomStorageEnabled(true);
        old.setWebViewClient(new WebViewClient(){
            @Override public void onPageFinished(WebView view,String url){
                old.evaluateJavascript("Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('bt.')).map(k=>[k,localStorage.getItem(k)]))",value->{
                    try{JSONObject records=new JSONObject(value);apply(records,0);}catch(Exception ignored){old.destroy();}
                });
            }
            private void apply(JSONObject records,int attempt){
                if(activity.isFinishing()||attempt>100){old.destroy();return;}
                WebView target=activity.getBridge().getWebView();
                String script="(()=>{if(location.origin!=='https://localhost'||document.readyState==='loading')return false;const records="+records.toString()+";for(const [key,value] of Object.entries(records)){if(localStorage.getItem(key)===null)localStorage.setItem(key,value)}return true})()";
                target.evaluateJavascript(script,result->{
                    if("true".equals(result)){prefs.edit().putBoolean("localOriginV1",true).apply();old.destroy();if(records.length()>0)target.reload();}
                    else new Handler(Looper.getMainLooper()).postDelayed(()->apply(records,attempt+1),100);
                });
            }
        });
        old.loadDataWithBaseURL("https://www.bakhtiyaraj.dev/budgettracker/","<!doctype html><title>Storage migration</title>","text/html","UTF-8",null);
    }
}
