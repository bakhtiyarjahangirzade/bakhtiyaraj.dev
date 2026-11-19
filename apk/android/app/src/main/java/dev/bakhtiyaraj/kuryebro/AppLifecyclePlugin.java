package dev.bakhtiyaraj.kuryebro;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name="AppLifecycle")
public class AppLifecyclePlugin extends Plugin {
    @PluginMethod public void info(PluginCall call){
        try{
            PackageInfo info=getContext().getPackageManager().getPackageInfo(getContext().getPackageName(),0);
            JSObject result=new JSObject();result.put("versionName",info.versionName);result.put("versionCode",Build.VERSION.SDK_INT>=28?info.getLongVersionCode():info.versionCode);result.put("sdk",Build.VERSION.SDK_INT);call.resolve(result);
        }catch(Exception error){call.reject("Cannot read app version",error);}
    }
    @PluginMethod public void openUpdate(PluginCall call){
        // The caller cannot redirect a user to an arbitrary APK or another scheme.
        try{getActivity().startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse("https://www.bakhtiyaraj.dev/budgettracker/kuryebro.apk?source=android-update")));call.resolve();}
        catch(Exception error){call.reject("No browser available",error);}
    }
}
