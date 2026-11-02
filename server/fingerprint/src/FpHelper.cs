using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using System.Threading;
using System.Text.RegularExpressions;
using System.Windows.Forms;

class WorkForm : Form
{
    public WorkForm()
    {
        ShowInTaskbar = false;
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.Manual;
        Location = new System.Drawing.Point(-32000, -32000);
        Size = new System.Drawing.Size(1, 1);
    }
    protected override void OnShown(EventArgs e)
    {
        base.OnShown(e);
        Program.StartCapture();
    }
}

class Program : DPFP.Capture.EventHandler
{
    static string command;
    static List<KeyValuePair<string, DPFP.Template>> templates;
    static int maxWaitMs = 30000;
    static DateTime deadline;
    static bool sawFinger = false;
    static bool readerConnected = false;
    static bool started = false;
    static string resultJson = null;
    static int exitCode = 0;
    static DPFP.Capture.Capture capture;
    static DPFP.Processing.FeatureExtraction extractor = new DPFP.Processing.FeatureExtraction();
    static DPFP.Processing.Enrollment enroller;
    static DPFP.Verification.Verification verificator = new DPFP.Verification.Verification();
    static System.Windows.Forms.Timer timer;
    static WorkForm host;

    static string Escape(string s)
    {
        if (s == null) return "";
        return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", " ").Replace("\n", " ");
    }

    static void Log(string msg) { Console.Error.WriteLine(msg); }

    [STAThread]
    static int Main(string[] args)
    {
        if (args.Length < 1)
        {
            Console.WriteLine("{\"success\":false,\"error\":\"Comando desconocido\"}");
            return 1;
        }
        command = args[0];
        string dataFile = args.Length > 1 ? args[1] : null;

        if (command != "available" && command != "enroll" && command != "identify" &&
            command != "auto-identify" && command != "status" && command != "wait")
        {
            Console.WriteLine("{\"success\":false,\"error\":\"Comando desconocido: " + Escape(command) + "\"}");
            return 1;
        }

        try
        {
            if (command == "identify" || command == "auto-identify")
            {
                if (dataFile == null || !File.Exists(dataFile))
                {
                    Console.WriteLine("{\"success\":false,\"error\":\"Faltan datos de plantillas\"}");
                    return 1;
                }
                templates = LoadTemplates(dataFile);
                if (templates.Count == 0)
                {
                    Console.WriteLine("{\"success\":false,\"error\":\"No hay plantillas validas\"}");
                    return 1;
                }
                if (command == "auto-identify") maxWaitMs = ReadMaxWait(dataFile);
            }
            if (command == "wait") maxWaitMs = (dataFile != null && File.Exists(dataFile)) ? ReadMaxWait(dataFile) : 30000;
            if (command == "enroll") enroller = new DPFP.Processing.Enrollment();

            if (command == "available") deadline = DateTime.UtcNow.AddMilliseconds(2500);
            else if (command == "status") deadline = DateTime.UtcNow.AddMilliseconds(1500);
            else if (command == "wait") deadline = DateTime.UtcNow.AddMilliseconds(maxWaitMs);
            else if (command == "enroll") deadline = DateTime.UtcNow.AddSeconds(90);
            else if (command == "identify") deadline = DateTime.UtcNow.AddSeconds(60);
            else if (command == "auto-identify") deadline = DateTime.UtcNow.AddMilliseconds(maxWaitMs);

            host = new WorkForm();

            if (command == "auto-identify") Console.WriteLine("{\"phase\":\"idle\"}");

            Application.Run(host);
        }
        catch (Exception ex)
        {
            Console.WriteLine("{\"success\":false,\"error\":\"" + Escape(ex.Message) + "\"}");
            return 1;
        }

        if (resultJson != null) Console.WriteLine(resultJson);
        return exitCode;
    }

    public static void StartCapture()
    {
        try
        {
            Log("creando captura...");
            capture = new DPFP.Capture.Capture();
            capture.EventHandler = new Program();
            Log("iniciando StartCapture...");
            capture.StartCapture();
            Log("captura iniciada");
            timer = new System.Windows.Forms.Timer();
            timer.Interval = 100;
            timer.Tick += (s, e) => OnTick();
            timer.Start();
        }
        catch (Exception ex)
        {
            Finish("{\"success\":false,\"error\":\"No se pudo iniciar la captura: " + Escape(ex.Message) + "\"}", 1);
        }
    }

    static void Finish(string json, int code)
    {
        if (resultJson != null) return;
        resultJson = json;
        exitCode = code;
        try { if (timer != null) timer.Stop(); } catch { }
        try { if (capture != null) capture.StopCapture(); } catch { }
        try { host.BeginInvoke(new Action(delegate { host.Close(); })); }
        catch { try { host.Close(); } catch { } }
    }

    static void OnTick()
    {
        if (resultJson != null) return;
        if (DateTime.UtcNow < deadline) return;

        switch (command)
        {
            case "available":
                Finish("{\"success\":false,\"error\":\"No se detecto el lector U.are.U. Conecta el dispositivo y verifica el driver.\"}", 1);
                break;
            case "status":
                if (!readerConnected) Finish("{\"success\":false,\"fingerPresent\":false,\"error\":\"No se detecto el lector U.are.U.\"}", 1);
                else Finish("{\"success\":true,\"fingerPresent\":false}", 0);
                break;
            case "wait":
                if (!readerConnected) Finish("{\"success\":false,\"fingerPresent\":false,\"error\":\"No se detecto el lector U.are.U.\"}", 1);
                else Finish("{\"success\":true,\"fingerPresent\":false}", 0);
                break;
            case "enroll":
                Finish("{\"success\":false,\"error\":\"No se completo el enrolamiento. Ponga el dedo 4 veces.\"}", 1);
                break;
            case "identify":
                Finish("{\"success\":false,\"matchedId\":null,\"compared\":0,\"error\":\"No se detecto huella\"}", 1);
                break;
            case "auto-identify":
                if (sawFinger) Finish("{\"phase\":\"result\",\"success\":false,\"fingerPresent\":true,\"error\":\"Huella no registrada\"}", 0);
                else Finish("{\"phase\":\"result\",\"success\":true,\"fingerPresent\":false}", 0);
                break;
        }
    }

    static bool Extract(DPFP.Sample sample, DPFP.Processing.DataPurpose purpose, out DPFP.FeatureSet features)
    {
        features = null;
        try
        {
            var feedback = DPFP.Capture.CaptureFeedback.None;
            var fs = new DPFP.FeatureSet();
            extractor.CreateFeatureSet(sample, purpose, ref feedback, ref fs);
            if (feedback == DPFP.Capture.CaptureFeedback.Good)
            {
                features = fs;
                return true;
            }
        }
        catch { }
        return false;
    }

    static void HandleEnroll(DPFP.Sample sample)
    {
        DPFP.FeatureSet features;
        if (!Extract(sample, DPFP.Processing.DataPurpose.Enrollment, out features))
        {
            Log("Muestra de baja calidad, intente de nuevo");
            return;
        }
        try
        {
            enroller.AddFeatures(features);
            Log("Muestra capturada. Restantes: " + enroller.FeaturesNeeded);
        }
        catch (Exception ex) { Log("Error agregando muestra: " + ex.Message); }

        if (enroller.TemplateStatus == DPFP.Processing.Enrollment.Status.Ready)
        {
            byte[] data = null;
            enroller.Template.Serialize(ref data);
            Finish("{\"success\":true,\"fmd\":\"" + Convert.ToBase64String(data) + "\"}", 0);
        }
        else if (enroller.TemplateStatus == DPFP.Processing.Enrollment.Status.Failed)
        {
            enroller.Clear();
            Log("Enrolamiento fallido, reiniciando");
        }
    }

    static void HandleIdentify(DPFP.Sample sample)
    {
        DPFP.FeatureSet features;
        if (!Extract(sample, DPFP.Processing.DataPurpose.Verification, out features)) return;

        string bestId = null;
        int bestFar = int.MaxValue;
        int compared = 0;
        foreach (var kv in templates)
        {
            compared++;
            var res = new DPFP.Verification.Verification.Result();
            try
            {
                verificator.Verify(features, kv.Value, ref res);
                if (res.Verified && res.FARAchieved < bestFar)
                {
                    bestFar = res.FARAchieved;
                    bestId = kv.Key;
                }
            }
            catch { }
        }

        if (command == "identify")
        {
            if (bestId != null)
                Finish("{\"success\":true,\"matchedId\":\"" + Escape(bestId) + "\",\"compared\":" + compared + "}", 0);
            else
                Finish("{\"success\":false,\"matchedId\":null,\"compared\":" + compared + ",\"error\":\"Huella no registrada\"}", 0);
        }
        else
        {
            sawFinger = true;
            if (bestId != null)
                Finish("{\"phase\":\"result\",\"success\":true,\"fingerPresent\":true,\"matchedId\":\"" + Escape(bestId) + "\",\"compared\":" + compared + "}", 0);
            else
                Console.WriteLine("{\"phase\":\"idle\"}");
        }
    }

    public void OnComplete(object c, string ReaderSerialNumber, DPFP.Sample Sample)
    {
        Log("[evento] OnComplete");
        if (resultJson != null) return;
        if (command == "enroll") HandleEnroll(Sample);
        else if (command == "identify" || command == "auto-identify") HandleIdentify(Sample);
    }
    public void OnFingerGone(object c, string ReaderSerialNumber) { Log("[evento] OnFingerGone"); }
    public void OnFingerTouch(object c, string ReaderSerialNumber)
    {
        Log("[evento] OnFingerTouch");
        if (command == "status" || command == "wait")
            Finish("{\"success\":true,\"fingerPresent\":true}", 0);
        else if (command == "auto-identify")
        {
            sawFinger = true;
            Console.WriteLine("{\"phase\":\"reading\"}");
        }
    }
    public void OnReaderConnect(object c, string ReaderSerialNumber)
    {
        Log("[evento] OnReaderConnect " + ReaderSerialNumber);
        readerConnected = true;
        if (command == "available") Finish("{\"success\":true}", 0);
    }
    public void OnReaderDisconnect(object c, string ReaderSerialNumber) { Log("[evento] OnReaderDisconnect"); readerConnected = false; }
    public void OnSampleQuality(object c, string ReaderSerialNumber, DPFP.Capture.CaptureFeedback CaptureFeedback) { Log("[evento] OnSampleQuality = " + CaptureFeedback); }

    static List<KeyValuePair<string, DPFP.Template>> LoadTemplates(string file)
    {
        var result = new List<KeyValuePair<string, DPFP.Template>>();
        string content = File.ReadAllText(file);
        var matches = Regex.Matches(content, "\"id\"\\s*:\\s*\"([^\"]+)\"\\s*,\\s*\"fmd\"\\s*:\\s*\"([^\"]+)\"");
        foreach (Match m in matches)
        {
            try
            {
                string id = m.Groups[1].Value;
                byte[] bytes = Convert.FromBase64String(m.Groups[2].Value);
                var template = new DPFP.Template(new MemoryStream(bytes));
                result.Add(new KeyValuePair<string, DPFP.Template>(id, template));
            }
            catch { }
        }
        return result;
    }

    static int ReadMaxWait(string file)
    {
        try
        {
            string content = File.ReadAllText(file);
            var m = Regex.Match(content, "\"maxWaitMs\"\\s*:\\s*(\\d+)");
            if (m.Success) return int.Parse(m.Groups[1].Value);
        }
        catch { }
        return 30000;
    }
}
