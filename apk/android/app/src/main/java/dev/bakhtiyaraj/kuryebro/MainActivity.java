package dev.bakhtiyaraj.kuryebro;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(android.os.Bundle state) {
        registerPlugin(ShiftTrackerPlugin.class);
        super.onCreate(state);
        StorageMigration.run(this);
    }
}
