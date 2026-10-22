package dev.lyvt.booksup;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;
import org.json.JSONObject;
import org.json.JSONArray;

// All requests are performed natively: Android WebView CORS and mixed-content
// restrictions cannot block the app's fixed HTTPS book data sources or LAN signaling.
@CapacitorPlugin(name = "BooksUpNetwork")
public class BooksUpNetworkPlugin extends Plugin {
    private static final Pattern PRIVATE_IP = Pattern.compile(
       "^(?:10\\.(?:\\d{1,3}\\.){2}\\d{1,3}|192\\.168\\.(?:\\d{1,3}\\.)\\d{1,3}|172\\.(?:1[6-9]|2\\d|3[01])\\.(?:\\d{1,3}\\.)\\d{1,3})$");

    private String enc(String value) throws Exception {
        return URLEncoder.encode(value == null ? "" : value, "UTF-8");
    }
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
    public void searchCatalog(PluginCall call) {
        final String title=call.getString("title","").trim();
        final String author=call.getString("author","").trim();
        final String isbn=call.getString("isbn","").replaceAll("[^0-9Xx]","");
        final String topic=call.getString("topic","").trim();
        if(title.length()>180||author.length()>120||topic.length()>60||(!topic.isEmpty()&&!topic.matches("[a-zA-Z0-9 -]{1,60}"))||(!isbn.isEmpty()&&!isbn.matches("(?:[0-9]{13}|[0-9]{9}[0-9Xx])"))){
            call.reject("Ungültige Buchsuchdaten");return;
        }
        if(title.isEmpty()&&isbn.isEmpty()&&topic.isEmpty()){call.reject("Titel oder ISBN erforderlich");return;}
        new Thread(()->{
            JSONArray google=new JSONArray(),open=new JSONArray(),errors=new JSONArray();
            try {
                String q=!topic.isEmpty()?"subject:"+topic:(isbn.isEmpty()?title+(author.isEmpty()?"":" "+author):"isbn:"+isbn);
                String g="https://www.googleapis.com/books/v1/volumes?q="+enc(q)+"&maxResults=40&printType=books";
                try {JSONArray rows=request(g,null).optJSONArray("items");if(rows!=null)for(int i=0;i<rows.length();i++)google.put(rows.opt(i));}
                catch(Exception e){errors.put("Google Books: "+e.getMessage());}
                String endpoint="https://openlibrary.org/search.json?"
                    +(isbn.isEmpty()?"q="+enc(q):"isbn="+enc(isbn))
                    +"&limit=40&fields=key,title,author_name,isbn,first_publish_year,cover_i,subject,language,publisher,series";
                try {JSONArray rows=request(endpoint,null).optJSONArray("docs");if(rows!=null)for(int i=0;i<rows.length();i++)open.put(rows.opt(i));}
                catch(Exception e){errors.put("Open Library: "+e.getMessage());}
                JSObject result=new JSObject();
                result.put("google",google);result.put("open",open);result.put("errors",errors);
                call.resolve(result);
            }catch(Exception e){call.reject("Buchkatalog: "+e.getMessage());}
        },"BooksUpNativeBookCatalog").start();
    }
    // Native translation avoids WebView CORS; no API keys are bundled into Android.
    @PluginMethod
    public void translateText(PluginCall call) {
        final JSONArray texts=call.getArray("texts");
        final String source=call.getString("source","de"),target=call.getString("target","de");
        final String endpoint=call.getString("url","https://de.libretranslate.com/translate");
        if(texts==null||texts.length()==0||texts.length()>16||
           !source.matches("auto|de|en|fr|es|it")||!target.matches("de|en|fr|es|it")){
            call.reject("Ungültige Übersetzungsanfrage");return;
        }
        try {
            URL url=new URL(endpoint);
            final String host=url.getHost().toLowerCase(java.util.Locale.ROOT);
            if(!url.getProtocol().equals("https")||url.getPort()!=-1||
               !url.getPath().equals("/translate")||url.getUserInfo()!=null||
               !host.matches("(?:[a-z0-9-]+\\.)+[a-z]{2,}")||
               host.equals("localhost")||host.endsWith(".local")){
                call.reject("Unsicherer Übersetzungsserver");return;
            }
            for(int i=0;i<texts.length();i++){
                if(!(texts.opt(i) instanceof String)||texts.optString(i).trim().isEmpty()||texts.optString(i).length()>180){
                    call.reject("Ungültiger Übersetzungstext");return;
                }
            }
        }catch(Exception e){call.reject("Ungültige Übersetzungs-URL");return;}
        new Thread(()->{
            try{
                JSONObject body=new JSONObject().put("q",texts).put("source",source).put("target",target).put("format","text");
                JSONObject result=request(endpoint,body);
                JSONArray translated=result.optJSONArray("translatedText");
                if(translated==null||translated.length()!=texts.length())throw new Exception("Ungültige Übersetzungsantwort");
                JSObject response=new JSObject();response.put("translatedText",translated);
                call.resolve(response);
            }catch(Exception e){call.reject("LibreTranslate: "+e.getMessage());}
        },"BooksUpLibreTranslate").start();
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