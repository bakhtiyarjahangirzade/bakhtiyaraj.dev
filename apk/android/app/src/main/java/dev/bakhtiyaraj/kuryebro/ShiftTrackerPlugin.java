package dev.bakhtiyaraj.kuryebro;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.os.Build;
import androidx.core.content.ContextCompat;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;

@CapacitorPlugin(name="ShiftTracker",permissions={
    @Permission(alias="location",strings={Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION}),
    @Permission(alias="notifications",strings={Manifest.permission.POST_NOTIFICATIONS})
})
public class ShiftTrackerPlugin extends Plugin {
    private boolean locationGranted(){return ContextCompat.checkSelfPermission(getContext(),Manifest.permission.ACCESS_FINE_LOCATION)==PackageManager.PERMISSION_GRANTED;}
    @PluginMethod public void start(PluginCall call){
        if(!locationGranted()||(Build.VERSION.SDK_INT>=33&&getPermissionState("notifications")==PermissionState.PROMPT)){
            requestPermissionForAliases(Build.VERSION.SDK_INT>=33?new String[]{"location","notifications"}:new String[]{"location"},call,"afterPermissions");return;
        }
        begin(call);
    }
    @PermissionCallback private void afterPermissions(PluginCall call){if(locationGranted())begin(call);else call.reject("Location permission denied");}
    private void begin(PluginCall call){
        String id=call.getString("id");if(id==null||!id.matches("[a-fA-F0-9-]{36}")){call.reject("Invalid shift ID");return;}
        LocationManager lm=(LocationManager)getContext().getSystemService(android.content.Context.LOCATION_SERVICE);
        if(!lm.isProviderEnabled(LocationManager.GPS_PROVIDER)&&!lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)){call.reject("Enable location services");return;}
        try{
            ShiftStore store=new ShiftStore(getContext());String previous=store.prefs.getString("id",null);
            if(previous!=null&&!previous.equals(id)){call.reject("Recover the previous shift before starting another");return;}
            String owner=call.getString("owner");if(owner==null||!owner.matches("[a-fA-F0-9-]{36}")){call.reject("Invalid account");return;}
            if(previous!=null&&!owner.equals(store.prefs.getString("owner",null))){call.reject("Previous shift belongs to another account");return;}
            store.begin(id);store.prefs.edit().putString("owner",owner).putString("time_zone",call.getString("timeZone",java.util.TimeZone.getDefault().getID())).commit();
            Intent intent=new Intent(getContext(),ShiftService.class).putExtra("id",id).putExtra("message",call.getString("message","Shift in progress"));
            ContextCompat.startForegroundService(getContext(),intent);call.resolve();
        }catch(Exception error){call.reject("Could not start tracking",error);}
    }
    @PluginMethod public void status(PluginCall call){try{call.resolve(JSObject.fromJSONObject(new ShiftStore(getContext()).snapshot()));}catch(Exception error){call.reject("Could not read route",error);}}
    @PluginMethod public void stop(PluginCall call){try{ShiftStore store=new ShiftStore(getContext());if(!store.prefs.contains("ended_at"))store.finish();ShiftService.running=false;getContext().stopService(new Intent(getContext(),ShiftService.class));call.resolve(JSObject.fromJSONObject(store.snapshot()));}catch(Exception error){call.reject("Could not finish shift",error);}}
    @PluginMethod public void clear(PluginCall call){if(ShiftService.running){call.reject("Shift still active");return;}try{new ShiftStore(getContext()).clear();call.resolve();}catch(Exception error){call.reject("Could not clear route",error);}}
}
