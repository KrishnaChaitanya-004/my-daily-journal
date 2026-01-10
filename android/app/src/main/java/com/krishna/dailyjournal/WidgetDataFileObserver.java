package com.krishna.dailyjournal;

import android.content.Context;
import android.os.FileObserver;
import android.util.Log;

import java.io.File;

/**
 * Watches widget-data.json for changes and forces a widget refresh.
 * This avoids any JS->native calls at runtime; the native side simply
 * observes the file the app already writes.
 */
public final class WidgetDataFileObserver {
  private static final String TAG = "WidgetDataFileObserver";

  private final FileObserver observer;

  public WidgetDataFileObserver(Context context) {
    File file = new File(context.getFilesDir(), "widget-data.json");
    // Watch the parent directory so we still get events if the file is replaced.
    File parent = file.getParentFile();

    observer = new FileObserver(parent.getAbsolutePath(),
      FileObserver.CREATE | FileObserver.MODIFY | FileObserver.MOVED_TO | FileObserver.CLOSE_WRITE) {
      @Override
      public void onEvent(int event, String path) {
        if (path == null) return;
        if (!"widget-data.json".equals(path)) return;

        // Debounce is intentionally simple: widget updates are cheap and infrequent.
        try {
          WidgetsUpdater.updateAll(context.getApplicationContext());
        } catch (Exception e) {
          Log.e(TAG, "Failed to refresh widgets after file change", e);
        }
      }
    };
  }

  public void start() {
    observer.startWatching();
  }

  public void stop() {
    observer.stopWatching();
  }
}
