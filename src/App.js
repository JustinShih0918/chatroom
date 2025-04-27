import { Link } from "react-router-dom";

function App() {
    return (
        <div>
            <h1>Firebase Example</h1>
            <p>
                <Link to="/authentication">Authentication</Link>
            </p>
            <p>
                <Link to="/database">Realtime Database</Link>
            </p>
        </div>
    );
}

export default App;
