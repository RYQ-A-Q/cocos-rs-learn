package com.cocos.game;  // 改成你的实际包名

import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.widget.Toast;
import androidx.core.app.NotificationCompat;
import com.cocos.lib.CocosHelper;

import online.rs.rslearn.R;

public class TestBridge {
    // ========== 类级别常量（所有方法都能访问）==========
    private static Activity sActivity;
    private static final String CHANNEL_ID = "cocos_test_channel";
    private static final int NOTIFICATION_ID = 1001;

    // ========== 初始化 ==========
    public static void init(Activity activity) {
        sActivity = activity;
        createNotificationChannel();
    }

    // ========== Toast + 震动 ==========
    public static void showToast(String message, int durationMs) {
        if (sActivity == null) return;

        sActivity.runOnUiThread(() -> {
            Toast.makeText(sActivity, message, Toast.LENGTH_SHORT).show();
        });
            doVibrate(durationMs);
        // 回调 JS
        CocosHelper.runOnGameThread(() -> {
            String js = "window.nativeCallback && window.nativeCallback('Android收到: " + message + "')";
            com.cocos.lib.CocosJavascriptJavaBridge.evalString(js);
        });
    }

    private static void doVibrate(int durationMs) {
        Vibrator vibrator = (Vibrator) sActivity.getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE));
        } else {
            vibrator.vibrate(durationMs);
        }
    }

    // ========== 通知栏消息 ==========
    public static void showNotification(String title, String content) {
        if (sActivity == null) return;

        sActivity.runOnUiThread(() -> {
            Intent intent = new Intent(sActivity, sActivity.getClass());
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

            PendingIntent pendingIntent = PendingIntent.getActivity(
                    sActivity,
                    0,
                    intent,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );
            NotificationCompat.Builder builder = new NotificationCompat.Builder(sActivity, CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_notification)
                    .setContentTitle(title)
                    .setContentText(content)
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .setContentIntent(pendingIntent)
                    .setAutoCancel(true);

            NotificationManager manager = (NotificationManager) sActivity.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.notify(NOTIFICATION_ID, builder.build());
            }
        });
    }

    // ========== 创建通知渠道 ==========
    private static void createNotificationChannel() {

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        if (sActivity == null) return;

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "游戏测试通知",
                NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription("Cocos Creator 测试通知渠道");

        NotificationManager manager = sActivity.getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }
}