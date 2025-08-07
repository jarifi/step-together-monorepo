import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useUser } from "../context/UserContext";
import Constants from 'expo-constants';
import { useRouter } from "expo-router"; //  Router importieren

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

export default function StepsPage() {
  const { token, userId } = useUser();
  const [steps, setSteps] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter(); //  Router initialisieren

  const handleSave = async () => {
    if (!token || !userId) return;
    if (!steps || isNaN(Number(steps)) || Number(steps) < 0) {
      console.log(" Ungültige Eingabe. Bitte eine natürliche Zahl eingeben.");
      return;
    }
  
    setLoading(true);
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const today = new Date().toISOString().split("T")[0];
  
    try {
      const url = `${API_BASE_URL}/step_log/user/${userId}`;
    
  
      const res = await fetch(url, { headers });
      const logs = await res.json();
  
      const todayLog = logs.find((l: any) => {
        const [day, month, year] = l.datum.split(",")[0].split(".");
        const logDate = `${year}-${month}-${day}`; 
        return logDate === today;
      });
  
      if (todayLog) {
     
        await fetch(`${API_BASE_URL}/step_log/${todayLog.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            anzahlSchritte: parseInt(steps),
          }),
        });
        console.log(" Update erfolgreich!");
      } else {
    
        await fetch(`${API_BASE_URL}/step_log`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId: parseInt(userId),
            datum: today,
            anzahlSchritte: parseInt(steps),
            challengeId: 1,
            teamId: 1,
          }),
        });
        console.log(" Neuer Log erstellt!");
      }
 //  Alert anzeigen und erst nach 3 Sekunden weiterleiten
 Alert.alert("Erfolgreich", "Die Schritte wurden gespeichert.");
 setTimeout(() => {
   router.push("/home");
 }, 3000);
      //  Nach erfolgreichem Speichern weiterleiten
      router.push("/home");
      
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schritte für heute</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={steps}
        onChangeText={setSteps}
        placeholder="Anzahl Schritte"
      />
      {loading ? (
        <ActivityIndicator size="large" color="#1b5e20" style={{ marginTop: 20 }} />
      ) : (
        <Button title="Speichern" onPress={handleSave} color="#16a34a" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f0fdf4", flex: 1 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16, color: "#064e3b" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
});
