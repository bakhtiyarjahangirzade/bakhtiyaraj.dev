package dev.bakhtiyaraj.kuryebro;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;

/** Private durable journal: route recording does not depend on a running WebView. */
final class ShiftStore {
    private static final Object LOCK=new Object();
    private final Context context;
    final SharedPreferences prefs;
    ShiftStore(Context context) { this.context=context; prefs=context.getSharedPreferences("shift",Context.MODE_PRIVATE); }
    private File journal(){return new File(context.getFilesDir(),"shift-points.jsonl");}
    synchronized void begin(String id) throws IOException { synchronized(LOCK){
        if(id.equals(prefs.getString("id","")) && !prefs.contains("ended_at"))return;
        try(FileOutputStream stream=new FileOutputStream(journal(),false)){stream.getFD().sync();}
        prefs.edit().clear().putString("id",id).putLong("started_at",System.currentTimeMillis()).putFloat("distance_m",0).commit();
    } }
    synchronized void append(double lat,double lng,long seconds,double distance) throws Exception { synchronized(LOCK){
        JSONArray point=new JSONArray().put(lat).put(lng).put(seconds);
        try(FileOutputStream stream=new FileOutputStream(journal(),true)){
            stream.write((point.toString()+"\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));stream.getFD().sync();
        }
        prefs.edit().putFloat("distance_m",(float)distance).commit();
    } }
    synchronized JSONObject snapshot() throws Exception { synchronized(LOCK){
        JSONArray points=new JSONArray();
        if(journal().exists())try(BufferedReader reader=new BufferedReader(new FileReader(journal()))){
            String line;while((line=reader.readLine())!=null){try{points.put(new JSONArray(line));}catch(Exception ignored){/* Ignore an incomplete final line after a power loss. */}}
        }
        JSONObject result=new JSONObject().put("id",prefs.getString("id",null)).put("started_at",prefs.getLong("started_at",0))
            .put("time_zone",prefs.getString("time_zone",java.util.TimeZone.getDefault().getID())).put("owner",prefs.getString("owner",null)).put("distance_m",prefs.getFloat("distance_m",0)).put("points",points).put("running",ShiftService.running);
        if(prefs.contains("ended_at"))result.put("ended_at",prefs.getLong("ended_at",0));
        return result;
    } }
    void finish(){synchronized(LOCK){prefs.edit().putLong("ended_at",System.currentTimeMillis()).commit();}}
    synchronized void clear() throws IOException { synchronized(LOCK){
        if(journal().exists()&&!journal().delete())throw new IOException("Cannot clear journal");
        prefs.edit().clear().commit();
    } }
}
