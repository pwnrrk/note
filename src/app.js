import { marked } from "marked";
import React, { useEffect, useState } from "react";
import "./app.css";

function getFile() {
  const path = window.api.path();
  const fs = window.api.fs();
  const files = fs.readdirSync(path.join(path.resolve(), "storage"));
  return files;
}

function getData(fileName) {
  const path = window.api.path();
  const fs = window.api.fs();
  const data = fs.readFileSync(
    path.join(path.resolve(), "storage", fileName),
    "utf8"
  );
  return data;
}

function writeFile(fileName, data) {
  const path = window.api.path();
  const fs = window.api.fs();
  fs.writeFileSync(path.join(path.resolve(), "storage", fileName), data);
}

function deleteFile(fileName) {
  const path = window.api.path();
  const fs = window.api.fs();
  fs.unlinkSync(path.join(path.resolve(), "storage", fileName));
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState();
  const [content, setContent] = useState();
  const [raw, setRaw] = useState("");
  const [currentScroll, setCurrentScoll] = useState(0);
  const [newFileName, setNewFileName] = useState("");
  const [alert, setAlert] = useState();

  useEffect(() => {
    setFiles(getFile());
  }, []);

  useEffect(() => {
    if (selectedFile) {
      const data = getData(selectedFile);
      setRaw(data);
      marked.parse(data, (err, res) => setContent(res));
    }
  }, [selectedFile]);

  useEffect(() => {
    if (raw) {
      marked.parse(raw, (err, res) => setContent(res));
    }
  }, [raw]);

  useEffect(() => {
    document.querySelectorAll(".md-view").forEach((elm) => {
      elm.scrollTop = currentScroll;
    });
  }, [currentScroll]);

  useEffect(() => {
    if (alert) {
      setTimeout(() => setAlert(undefined), 1500);
    }
  }, [alert]);

  const handleScroll = (event) => {
    setCurrentScoll(event.target.scrollTop);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    writeFile(`${newFileName}.md`, "");
    const files = getFile();
    setFiles(files);
    setNewFileName("");
    setAlert("Created");
  };

  const handleDelete = () => {
    const file = selectedFile;
    deleteFile(selectedFile);
    setFiles(getFile());
    setSelectedFile(undefined);
    setRaw("");
    setContent(undefined);
    setAlert(`Deleted ${file}`);
  };

  const handleSave = () => {
    writeFile(selectedFile, raw);
    setAlert("Saved !");
  };

  return (
    <main className="container">
      <nav className="toolbar">
        <button style={{ color: "var(--danger)" }} onClick={handleDelete}>
          Delete
        </button>
        <button onClick={handleSave}>Save</button>
      </nav>
      <div className="main-pane">
        <div className="file-list">
          <div className="file-item flex">
            <input type="search" placeholder="Search" />
          </div>
          <div className="inner-file-list">
            {files?.map((file) => (
              <div
                className={`file-item ${selectedFile == file ? "active" : ""}`}
                key={file}
                onClick={() => setSelectedFile(file)}
              >
                {file}
              </div>
            ))}
          </div>
          <div className="file-item flex">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="New File"
                value={newFileName}
                onChange={(ev) => setNewFileName(ev.target.value)}
              />
            </form>
          </div>
        </div>
        <textarea
          className="file-edit md-view"
          value={raw}
          onChange={(ev) => setRaw(ev.target.value)}
          onScroll={handleScroll}
        ></textarea>
        <div onScroll={handleScroll} className="file-view md-view">
          {selectedFile && content && (
            <div dangerouslySetInnerHTML={{ __html: content }}></div>
          )}
        </div>
      </div>
      {alert && <div className="alert success">{alert}</div>}
    </main>
  );
}
