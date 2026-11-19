package dev.bakhtiyaraj.kuryebro;

import android.app.*;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.location.*;
import android.os.*;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;

public class ShiftService extends Service implements LocationListener {
    static volatile boolean running=false;
    private LocationManager locations;
    private ShiftStore store;
    private Location last;
    private double distance;
    private HandlerThread worker;
    private static final String CHANNEL="kuryebro-shift";
    @Override public void onCreate(){super.onCreate();store=new ShiftStore(this);locations=(LocationManager)getSystemService(LOCATION_SERVICE);worker=new HandlerThread("shift-recorder");worker.start();}
    @Override public int onStartCommand(Intent intent,int flags,int startId){
        try{
            String id=intent==null?store.prefs.getString("id",null):intent.getStringExtra("id");
            if(id==null){stopSelf();return START_NOT_STICKY;}
            store.begin(id);
            if(Build.VERSION.SDK_INT>=26){
                NotificationChannel channel=new NotificationChannel(CHANNEL,"KuryeBro shifts",NotificationManager.IMPORTANCE_LOW);
                ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(channel);
            }
            PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
            String message=intent==null?"Shift in progress":intent.getStringExtra("message");
            Notification notification=new NotificationCompat.Builder(this,CHANNEL).setSmallIcon(R.drawable.ic_stat_shift)
                .setContentTitle("KuryeBro").setContentText(message==null?"Shift in progress":message).setContentIntent(open)
                .setOngoing(true).setCategory(NotificationCompat.CATEGORY_SERVICE).setOnlyAlertOnce(true).build();
            if(Build.VERSION.SDK_INT>=29)startForeground(41,notification,ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);else startForeground(41,notification);
            if(running)return START_STICKY;
            JSONArray points=store.snapshot().getJSONArray("points");distance=store.prefs.getFloat("distance_m",0);
            if(points.length()>0){JSONArray p=points.getJSONArray(points.length()-1);last=new Location("journal");last.setLatitude(p.getDouble(0));last.setLongitude(p.getDouble(1));last.setTime(p.getLong(2)*1000);}
            if(androidx.core.content.ContextCompat.checkSelfPermission(this,android.Manifest.permission.ACCESS_FINE_LOCATION)!=android.content.pm.PackageManager.PERMISSION_GRANTED){stopSelf();return START_NOT_STICKY;}
            running=true;
            if(locations.isProviderEnabled(LocationManager.GPS_PROVIDER))locations.requestLocationUpdates(LocationManager.GPS_PROVIDER,5000,5,this,worker.getLooper());
            if(locations.isProviderEnabled(LocationManager.NETWORK_PROVIDER))locations.requestLocationUpdates(LocationManager.NETWORK_PROVIDER,10000,10,this,worker.getLooper());
            return START_STICKY;
        }catch(Exception error){android.util.Log.e("KuryeBroShift","Cannot record location",error);running=false;stopSelf();return START_NOT_STICKY;}
    }
    @Override public void onLocationChanged(Location fix){
        if(!running||store.prefs.contains("ended_at")||!fix.hasAccuracy()||fix.getAccuracy()>60)return;
        if(last!=null){
            long delta=fix.getTime()-last.getTime();float meters=last.distanceTo(fix);
            if(delta<=0||meters/delta*1000>45)return;
            // Retain stationary samples every 30 seconds, so stop durations remain measurable.
            if(meters<8&&delta<30000)return;
            if(meters>=8)distance+=meters;
        }
        try{store.append(fix.getLatitude(),fix.getLongitude(),fix.getTime()/1000,distance);last=new Location(fix);}
        catch(Exception error){android.util.Log.e("KuryeBroShift","Cannot persist route",error);running=false;stopSelf();}
    }
    @Override public void onDestroy(){running=false;if(locations!=null)locations.removeUpdates(this);if(worker!=null)worker.quitSafely();super.onDestroy();}
    @Override public IBinder onBind(Intent intent){return null;}
    @Override public void onProviderEnabled(String provider){}
    @Override public void onProviderDisabled(String provider){}
    @Override public void onStatusChanged(String provider,int status,Bundle extras){}
}
