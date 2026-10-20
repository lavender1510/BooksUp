package dev.lyvt.booksup;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import java.util.Arrays;

import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.content.ActivityNotFoundException;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.InputStream;
import java.io.FileOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "BooksUpUpdater")
public class BooksUpUpdaterPlugin extends Plugin {
  @PluginMethod
  public void installGithubApk(PluginCall call) {
    final String uri = call.getString("url", "");
    if (!uri.matches("^https://github\\.com/lavender1510/BooksUp/releases/download/[^?#]+/[^/?#]+\\.apk$")) {
      call.reject("Nur offizielle BooksUp-APK-Dateien von GitHub sind zugelassen.");
      return;
    }
    if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
      Intent settings = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
              Uri.parse("package:" + getContext().getPackageName()));
      settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getContext().startActivity(settings);
      call.reject("Erlaube Installationen aus BooksUp in Android-Einstellungen und starte den Download erneut.");
      return;
    }
    new Thread(() -> {
      File temp = null;
      try {
        File folder = new File(getContext().getCacheDir(), "updates");
        if (!folder.exists() && !folder.mkdirs()) throw new Exception("Update-Speicher nicht verfügbar");
        temp = new File(folder, "BooksUp-update.apk");
        HttpURLConnection connection = (HttpURLConnection) new URL(uri).openConnection();
        connection.setInstanceFollowRedirects(true);
        connection.setConnectTimeout(16000);
        connection.setReadTimeout(22000);
        connection.setRequestProperty("User-Agent", "BooksUp-Android-5.0");
        int size = 0;
        try {
          if (connection.getResponseCode() != 200) throw new Exception("Download HTTP " + connection.getResponseCode());
          try (InputStream input = connection.getInputStream(); FileOutputStream output = new FileOutputStream(temp)) {
            byte[] block = new byte[32768];
            int count;
            while ((count = input.read(block)) != -1) {
              size += count;
              if (size % (512*1024) < block.length) {JSObject progress=new JSObject();progress.put("downloadedBytes",size);progress.put("totalBytes",connection.getContentLengthLong());notifyListeners("downloadProgress",progress);}
              if (size > 100 * 1024 * 1024) throw new Exception("APK ist zu groß");
              output.write(block, 0, count);
            }
          }
        } finally {
          connection.disconnect();
        }
        if (size < 100000) throw new Exception("APK unvollständig");
        // APK installer can never update an existing package signed with an ephemeral
        // different key. Reject before launching install, preserving all app data.
        PackageManager pm=getContext().getPackageManager();
        final int flags=Build.VERSION.SDK_INT>=28?PackageManager.GET_SIGNING_CERTIFICATES:PackageManager.GET_SIGNATURES;
        PackageInfo incoming=pm.getPackageArchiveInfo(temp.getAbsolutePath(),flags);
        if(incoming==null||!getContext().getPackageName().equals(incoming.packageName))
          throw new Exception("Keine gültige BooksUp-APK. Download wurde nicht installiert.");
        PackageInfo current=pm.getPackageInfo(getContext().getPackageName(),flags);
        Signature[] oldCert=Build.VERSION.SDK_INT>=28?current.signingInfo.getApkContentsSigners():current.signatures;
        Signature[] newCert=Build.VERSION.SDK_INT>=28?incoming.signingInfo.getApkContentsSigners():incoming.signatures;
        if(oldCert==null||newCert==null||oldCert.length==0||newCert.length==0||!Arrays.equals(oldCert,newCert))
          throw new Exception("Update blockiert: Die APK hat eine andere Signatur als deine installierte Version. NICHT deinstallieren! Erst ein vollständiges, geprüftes Backup erstellen.");
        if(Build.VERSION.SDK_INT>=28&&incoming.getLongVersionCode()<=current.getLongVersionCode())
          throw new Exception("Die heruntergeladene APK ist nicht neuer als die installierte Version.");
        JSObject complete=new JSObject();complete.put("downloadedBytes",size);complete.put("totalBytes",size);notifyListeners("downloadProgress",complete);
        Uri content = FileProvider.getUriForFile(getContext(),
              getContext().getPackageName() + ".booksup.fileprovider", temp);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(content, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        JSObject result = new JSObject();
        result.put("message", "APK heruntergeladen. Android-Installationsdialog geöffnet; Installation muss bestätigt werden.");
        call.resolve(result);
      } catch (Exception ex) {
        if (temp != null) temp.delete();
        call.reject("APK-Update fehlgeschlagen: " + ex.getMessage());
      }
    }, "booksup-apk-updater").start();
  }
}
