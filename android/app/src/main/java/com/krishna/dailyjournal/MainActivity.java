package com.krishna.dailyjournal;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  private static final String TAG = "MainActivity";
  private String pendingNavigation = null;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // Set the splash theme before super.onCreate
    setTheme(R.style.AppTheme_NoActionBar);
    super.onCreate(savedInstanceState);

    // Start native file observer so widgets refresh whenever widget-data.json changes.
    WidgetSyncManager.ensureStarted(this);

    // Ensure daily reset refresh is scheduled (works even if app is killed).
    try {
      WidgetAlarmScheduler.scheduleNextMidnightRefresh(this);
    } catch (Exception ignored) {
      // Best-effort; widget updatePeriodMillis still provides eventual refresh.
    }

    // Handle widget click intents
    handleWidgetIntent(getIntent());
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    handleWidgetIntent(intent);
  }

  private void handleWidgetIntent(Intent intent) {
    if (intent == null) return;
    
    // Check if opened from Habits Progress widget
    if (intent.getBooleanExtra("openHabits", false)) {
      intent.removeExtra("openHabits");
      pendingNavigation = "/habits";
    }
    
    // Check if opened from Stats widget
    if (intent.getBooleanExtra("openStatistics", false)) {
      intent.removeExtra("openStatistics");
      pendingNavigation = "/statistics";
    }
    
    // Check if opened from Quick Entry widget
    if (intent.getBooleanExtra("openEditor", false)) {
      intent.removeExtra("openEditor");
      pendingNavigation = "/editor";
    }
    
    // Execute navigation after WebView is ready
    if (pendingNavigation != null) {
      executeNavigation();
    }
  }
  
  private void executeNavigation() {
    if (pendingNavigation == null) return;
    
    final String route = pendingNavigation;
    pendingNavigation = null;
    
    // Delay to ensure WebView is fully loaded
    new Handler(Looper.getMainLooper()).postDelayed(() -> {
      try {
        if (getBridge() != null && getBridge().getWebView() != null) {
          getBridge().getWebView().evaluateJavascript(
            "if(window.location.pathname !== '" + route + "') { window.location.href = '" + route + "'; }",
            null
          );
          Log.d(TAG, "Navigated to: " + route);
        }
      } catch (Exception e) {
        Log.e(TAG, "Navigation failed", e);
      }
    }, 500);
  }

  @Override
  public void onResume() {
    super.onResume();

    // Refresh all widgets when app comes to foreground
    try {
      WidgetsUpdater.updateAll(this);
      WidgetAlarmScheduler.scheduleNextMidnightRefresh(this);
      Log.d(TAG, "Widgets refreshed on resume");
    } catch (Exception e) {
      Log.e(TAG, "Failed to refresh widgets on resume", e);
    }
    
    // Execute pending navigation if any
    if (pendingNavigation != null) {
      executeNavigation();
    }
  }
}
