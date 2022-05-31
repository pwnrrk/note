import { marked } from "marked";
import React, { useEffect, useState } from "react";
import {
  Stack,
  Box,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Divider,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import hljs from "highlight.js";
import "highlight.js/styles/default.css";

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
  const [highlight, setHighlight] = useState();
  const [currentScroll, setCurrentScoll] = useState(0);
  const [newFileName, setNewFileName] = useState("");
  const [alert, setAlert] = useState();
  const [focusItem, setFocusItem] = useState();
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    setFiles(getFile());
  }, []);

  useEffect(() => {
    if (selectedFile) {
      const data = getData(selectedFile);
      setRaw(data);
      marked.parse(data, (err, res) => setContent(res));
      setHighlight(hljs.highlight(data, { language: "md" }).value);
    }
  }, [selectedFile]);

  useEffect(() => {
    if (raw) {
      marked.parse(raw, (err, res) => setContent(res));
      setHighlight(hljs.highlight(raw, { language: "md" }).value);
      writeFile(selectedFile, raw);
    }
  }, [raw]);

  useEffect(() => {
    document.querySelectorAll(".md-view").forEach((elm) => {
      elm.scrollTop = currentScroll;
    });
  }, [currentScroll]);

  const handleScroll = (event) => {
    setCurrentScoll(event.target.scrollTop);
  };

  const handleDelete = (fileName) => {
    deleteFile(fileName);
    setAlert("Deleted");
    refresh();
  };

  const refresh = () => {
    const files = getFile();
    setFiles(files);
    setNewFileName("");
    setFocusItem(undefined);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    writeFile(`${newFileName}.md`, "");
    setAlert(`${newFileName} Created`);
    refresh();
  };

  return (
    <Stack
      direction="row"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
    >
      <Stack>
        <Box padding="8px">
          <TextField
            label="Search"
            variant="standard"
            value={searchText}
            onChange={(ev) => setSearchText(ev.target.value)}
          />
        </Box>
        <Box flex={1} overflow="auto">
          <List flex={1}>
            {files
              ?.filter((file) =>
                searchText
                  ? file.toUpperCase().includes(searchText.toUpperCase())
                  : true
              )
              .map((file) => (
                <ListItemButton
                  selected={selectedFile === file}
                  key={file}
                  onClick={() => setSelectedFile(file)}
                  onContextMenu={(ev) =>
                    setFocusItem({ x: ev.clientX, y: ev.clientY, file })
                  }
                >
                  <ListItemText>{file}</ListItemText>
                </ListItemButton>
              ))}
          </List>
        </Box>
        <Box padding="8px">
          <form onSubmit={handleSubmit}>
            <TextField
              label="New File"
              variant="standard"
              value={newFileName}
              onChange={(ev) => setNewFileName(ev.target.value)}
            />
          </form>
        </Box>
      </Stack>
      <Divider orientation="vertical" flexItem />
      <Stack flex={1} gap={1}>
        <Box paddingX={2}>
          <Typography fontWeight={500} variant="h6">
            {selectedFile || "Open File To Edit"}
          </Typography>
        </Box>
        <Stack direction="row" overflow="auto" flex={1}>
          <Box flex={1} position="relative">
            <div
              className="highlight-js md-view"
              dangerouslySetInnerHTML={{ __html: highlight }}
            ></div>
            {selectedFile && (
              <textarea
                className="file-edit md-view"
                value={raw}
                onChange={(ev) => setRaw(ev.target.value)}
                onScroll={handleScroll}
              ></textarea>
            )}
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box
            flex={1}
            padding="8px"
            overflow="auto"
            className="md-view"
            onScroll={handleScroll}
          >
            {selectedFile && content && (
              <div dangerouslySetInnerHTML={{ __html: content }}></div>
            )}
          </Box>
        </Stack>
      </Stack>
      <Snackbar
        open={alert !== undefined}
        autoHideDuration={3000}
        onClose={() => setAlert(undefined)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setAlert(undefined)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {alert}
        </Alert>
      </Snackbar>
      <Menu
        id="item-context"
        open={focusItem !== undefined}
        onClose={() => setFocusItem(undefined)}
        anchorReference="anchorPosition"
        anchorPosition={
          focusItem !== undefined
            ? { top: focusItem.y, left: focusItem.x }
            : undefined
        }
      >
        <MenuItem onClick={() => handleDelete(focusItem.file)}>Delete</MenuItem>
      </Menu>
    </Stack>
  );
}
