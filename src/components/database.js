import { onValue, ref, set } from "firebase/database";
import { useState } from "react";
import { db } from "../config";

export const Database = () => {
    const [refWrite, setRefWrite] = useState("");
    const [refRead, setRefRead] = useState("");
    const [data, setData] = useState("");

    const handleWrite = () => {
        set(ref(db, refWrite), {
            data_name: data
        });
        setRefWrite("");
        setData("");
    };

    const handleRead = () => {
        onValue(ref(db, refRead), (snapshot) => {
            var readResult = document.getElementById('readResult');
            readResult.innerHTML = snapshot.val() ? snapshot.val().data_name : "No data found";
        });
        setRefRead("");
    };

    return (
        <>
            <h1>Firebase Realtime Database</h1>
            <div>
                <h2>Write Data</h2>
                <input
                    placeholder="Reference"
                    value={refWrite}
                    onChange={(e) => setRefWrite(e.target.value)}
                />
                <input
                    placeholder="Data"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                />
                <button onClick={handleWrite}>Write</button>
            </div>
            <div>
                <h2>Read Data</h2>
                <input
                    placeholder="Reference"
                    value={refRead}
                    onChange={(e) => setRefRead(e.target.value)}
                />
                <p id="readResult"></p>
                <button onClick={handleRead}>Read</button>
            </div>
        </>
    );
};
