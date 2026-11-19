package dev.bakhtiyaraj.kuryebro;

import static org.junit.Assert.*;
import android.content.*;
import android.location.*;
import android.os.*;
import android.view.KeyEvent;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONObject;
import org.junit.*;
import org.junit.runner.RunWith;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

@RunWith(AndroidJUnit4.class)
public class ShiftIntegrationTest {
    private Context context;
    private MainActivity activity;
    private ShiftStore store;
    private void shell(String command) throws Exception {
        try(ParcelFileDescriptor descriptor=InstrumentationRegistry.getInstrumentation().getUiAutomation().executeShellCommand(command);
            java.io.FileInputStream stream=new java.io.FileInputStream(descriptor.getFileDescriptor())){stream.readAllBytes();}
    }
    @Before public void setup() throws Exception {
        context=InstrumentationRegistry.getInstrumentation().getTargetContext();store=new ShiftStore(context);
        context.stopService(new Intent(context,ShiftService.class));ShiftService.running=false;store.clear();
        for(String permission:new String[]{"ACCESS_FINE_LOCATION","ACCESS_COARSE_LOCATION","POST_NOTIFICATIONS"})shell("pm grant "+context.getPackageName()+" android.permission."+permission);
        shell("input keyevent WAKEUP");shell("wm dismiss-keyguard");
        Intent launch=new Intent(context,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        activity=(MainActivity)InstrumentationRegistry.getInstrumentation().startActivitySync(launch);
    }
    @After public void cleanup() throws Exception {
        shell("input keyevent WAKEUP");shell("wm dismiss-keyguard");
        context.stopService(new Intent(context,ShiftService.class));ShiftService.running=false;store.clear();
        shell("svc wifi enable");shell("svc data enable");
    }
    private String js(String script) throws Exception {
        CountDownLatch latch=new CountDownLatch(1);AtomicReference<String> value=new AtomicReference<>();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(()->activity.getBridge().getWebView().evaluateJavascript(script,result->{value.set(result);latch.countDown();}));
        assertTrue(latch.await(5,TimeUnit.SECONDS));return value.get();
    }
    @Test public void routeJournalSurvivesStoreRecreationAndFinishing() throws Exception {
        String id=UUID.randomUUID().toString();store.begin(id);store.append(40.4,49.8,1000,0);store.append(40.401,49.801,1010,140);
        JSONObject restored=new ShiftStore(context).snapshot();assertEquals(id,restored.getString("id"));assertEquals(2,restored.getJSONArray("points").length());assertEquals(140,restored.getDouble("distance_m"),0.01);
        store.finish();assertTrue(new ShiftStore(context).snapshot().has("ended_at"));
    }
    @Test public void packagedAppLaunchesWithoutAnyNetwork() throws Exception {
        shell("svc wifi disable");shell("svc data disable");
        InstrumentationRegistry.getInstrumentation().runOnMainSync(()->activity.getBridge().getWebView().reload());
        long deadline=System.currentTimeMillis()+15000;String text="";
        while(System.currentTimeMillis()<deadline){text=js("document.body.innerText");if(text!=null&&text.contains("KuryeBro"))break;Thread.sleep(100);}
        assertTrue("Bundled login screen loads offline: "+text,text.contains("KuryeBro"));
        assertEquals("\"https://localhost\"",js("location.origin"));
    }
    @Test public void webBridgeCanStartReadAndFinishANativeShift() throws Exception {
        long deadline=System.currentTimeMillis()+10000;
        while(System.currentTimeMillis()<deadline){if("\"function\"".equals(js("typeof window.Capacitor?.Plugins?.ShiftTracker?.start")))break;Thread.sleep(100);}
        assertEquals("\"function\"",js("typeof window.Capacitor.Plugins.ShiftTracker.start"));
        String id=UUID.randomUUID().toString(),owner=UUID.randomUUID().toString();
        js("window.__nativeResult=null;window.Capacitor.Plugins.ShiftTracker.start({id:'"+id+"',owner:'"+owner+"',timeZone:'Europe/Berlin'}).then(()=>window.__nativeResult='ok').catch(e=>window.__nativeResult=String(e))");
        deadline=System.currentTimeMillis()+10000;
        while(System.currentTimeMillis()<deadline){if("\"ok\"".equals(js("window.__nativeResult")))break;Thread.sleep(100);}
        assertEquals("\"ok\"",js("window.__nativeResult"));
        assertEquals(owner,store.snapshot().getString("owner"));
        assertEquals("Europe/Berlin",new ShiftStore(context).snapshot().getString("time_zone"));
        js("window.__nativeResult=null;window.Capacitor.Plugins.ShiftTracker.stop().then(()=>window.__nativeResult='ok')");
        deadline=System.currentTimeMillis()+5000;while(System.currentTimeMillis()<deadline){if(store.snapshot().has("ended_at"))break;Thread.sleep(100);}
        assertTrue(store.snapshot().has("ended_at"));
    }
    @Test public void versionBridgeAndSystemBackWorkOnCurrentAndroid() throws Exception {
        long deadline=System.currentTimeMillis()+15000;
        while(System.currentTimeMillis()<deadline){if("\"function\"".equals(js("typeof window.Capacitor?.Plugins?.AppLifecycle?.info")))break;Thread.sleep(100);}
        js("window.__version=null;window.Capacitor.Plugins.AppLifecycle.info().then(info=>window.__version=info.versionCode)");
        deadline=System.currentTimeMillis()+5000;
        while(System.currentTimeMillis()<deadline){if("4".equals(js("window.__version")))break;Thread.sleep(100);}
        assertEquals("4",js("window.__version"));
        assertEquals(36,context.getApplicationInfo().targetSdkVersion);
        js("window.__backHandled=false;window.kuryebroBack=()=>{window.__backHandled=true;return true}");
        shell("input keyevent BACK");
        deadline=System.currentTimeMillis()+5000;
        while(System.currentTimeMillis()<deadline){if("true".equals(js("window.__backHandled")))break;Thread.sleep(100);}
        assertEquals("true",js("window.__backHandled"));
        android.view.View content=activity.findViewById(android.R.id.content);
        assertTrue("System bar inset is applied",content.getPaddingTop()>0);
        assertTrue("Status icons contrast with the light app",androidx.core.view.WindowCompat.getInsetsController(activity.getWindow(),activity.getWindow().getDecorView()).isAppearanceLightStatusBars());
    }
    @Test public void migratesHostedStorageWithoutNetwork() throws Exception {
        CountDownLatch seeded=new CountDownLatch(1);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(()->{
            android.webkit.WebView old=new android.webkit.WebView(activity);old.getSettings().setJavaScriptEnabled(true);old.getSettings().setDomStorageEnabled(true);
            old.setWebViewClient(new android.webkit.WebViewClient(){@Override public void onPageFinished(android.webkit.WebView view,String url){
                old.evaluateJavascript("localStorage.setItem('bt.migration-test','preserved')",result->{old.destroy();seeded.countDown();});
            }});
            old.loadDataWithBaseURL("https://www.bakhtiyaraj.dev/budgettracker/","<!doctype html><title>Migration test</title>","text/html","UTF-8",null);
        });
        assertTrue(seeded.await(10,TimeUnit.SECONDS));
        js("localStorage.removeItem('bt.migration-test')");
        context.getSharedPreferences("migration",0).edit().clear().commit();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(()->StorageMigration.run(activity));
        long deadline=System.currentTimeMillis()+10000;String value="";
        while(System.currentTimeMillis()<deadline){value=js("localStorage.getItem('bt.migration-test')");if("\"preserved\"".equals(value))break;Thread.sleep(100);}
        assertEquals("\"preserved\"",value);
    }
    @Test public void foregroundShiftRecordsWhileScreenIsOff() throws Exception {
        shell("appops set "+context.getPackageName()+" android:mock_location allow");
        LocationManager manager=(LocationManager)context.getSystemService(Context.LOCATION_SERVICE);
        manager.addTestProvider(LocationManager.GPS_PROVIDER,false,false,false,false,true,true,true,Criteria.POWER_LOW,Criteria.ACCURACY_FINE);
        manager.setTestProviderEnabled(LocationManager.GPS_PROVIDER,true);
        String id=UUID.randomUUID().toString();store.begin(id);
        androidx.core.content.ContextCompat.startForegroundService(context,new Intent(context,ShiftService.class).putExtra("id",id));
        long deadline=System.currentTimeMillis()+5000;while(!ShiftService.running&&System.currentTimeMillis()<deadline)Thread.sleep(50);
        assertTrue("Foreground service starts",ShiftService.running);
        long base=System.currentTimeMillis();
        try{
            for(int i=0;i<3;i++){
                if(i==1){shell("input keyevent HOME");shell("input keyevent SLEEP");}
                Location point=new Location(LocationManager.GPS_PROVIDER);point.setLatitude(40.4093);point.setLongitude(49.8671+i*.001);
                point.setAccuracy(5);point.setTime(base+i*10000);point.setElapsedRealtimeNanos(SystemClock.elapsedRealtimeNanos());
                manager.setTestProviderLocation(LocationManager.GPS_PROVIDER,point);Thread.sleep(5500);
            }
            JSONObject route=store.snapshot();assertTrue("Points persist with screen off",route.getJSONArray("points").length()>=2);
            assertTrue("Distance accumulates",route.getDouble("distance_m")>50);assertTrue(ShiftService.running);
        }finally{manager.removeTestProvider(LocationManager.GPS_PROVIDER);}
    }
}
