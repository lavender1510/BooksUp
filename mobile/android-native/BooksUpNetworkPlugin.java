package dev.lyvt.booksup;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;
import org.json.JSONObject;

// Local LAN signaling only. No remote catalog or translation API.
@CapacitorPlugin(name = "BooksUpNetwork")
public class BooksUpNetworkPlugin extends Plugin {
    private static final Pattern PRIVATE_IP = Pattern.compile(
       "^(?:10\\.(?:\\d{1,3}\\.){2}\\d{1,3}|192\\.168\\.(?:\\d{1,3}\\.)\\d{1,3}|172\\.(?:1[6-9]|2\\d|3[01])\\.(?:\\d{1,3}\\.)\\d{1,3})$");

    private JSONObject request(String uri, JSONObject body) throws Exception {
        URL url=new URL(uri);
        HttpURLConnection c=(HttpURLConnection)url.openConnection();
        try {
            c.setConnectTimeout(11000);
            c.setReadTimeout(14000);
            c.setRequestProperty("User-Agent", "BooksUp-Android/5.2");
            c.setRequestProperty("Accept", "application/json");
            if(body!=null){
                c.setRequestMethod("POST");
                c.setDoOutput(true);
                c.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                try(OutputStream out=c.getOutputStream()){out.write(body.toString().getBytes(StandardCharsets.UTF_8));}
            }
            int code=c.getResponseCode();
            if(code<200||code>=300)throw new Exception("HTTP "+code+" from "+url.getHost());
            try(InputStream input=c.getInputStream();ByteArrayOutputStream bytes=new ByteArrayOutputStream()){
                byte[] chunk=new byte[8192];int n;
                while((n=input.read(chunk))!=-1){
                    if(bytes.size()+n>2300000)throw new Exception("Katalogantwort zu groß");
                    bytes.write(chunk,0,n);
                }
                return new JSONObject(new String(bytes.toByteArray(),StandardCharsets.UTF_8));
            }
        }finally{c.disconnect();}
    }
    @PluginMethod
    public void signal(PluginCall call){
        String ip=call.getString("ip",""),pin=call.getString("pin","");
        int port=call.getInt("port",0);
        String action=call.getString("action","offer");
        if(!PRIVATE_IP.matcher(ip).matches()||!pin.matches("[0-9]{6}")||port<1024||port>65535||!action.matches("offer|answer")){
            call.reject("Ungültige lokale IP, PIN oder Port");return;
        }
        for(String octet:ip.split("\\.")){if(Integer.parseInt(octet)>255){call.reject("IP-Adresse ungültig");return;}}
        final JSONObject payload;
        if(action.equals("answer")){
            try{payload=new JSONObject().put("answer",new JSONObject(call.getObject("answer",new JSObject()).toString()));}
            catch(Exception e){call.reject("WebRTC-Antwort ungültig");return;}
        }else payload=null;
        new Thread(()->{
            try{
                JSONObject response=request("http://"+ip+":"+port+"/"+action+"?pin="+pin,payload);
                call.resolve(new JSObject(response.toString()));
            }catch(Exception e){
                call.reject("Lokale Verbindung: "+e.getMessage()+". WLAN/Hotspot, Windows-Firewall und die angezeigte IP prüfen.");
            }
        },"BooksUpNativeLAN").start();
    }
}