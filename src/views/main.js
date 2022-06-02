import { marked } from "marked";
import React, { useEffect, useState, useRef } from "react";
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
import prettier from "prettier";
import markdownParser from "prettier/parser-markdown";
import "highlight.js/styles/default.css";

function getFile() {
  const path = window.api.path();
  const fs = window.api.fs();
  const dir = path.join(path.resolve(), "storage");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
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

export default function Main() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState();
  const [content, setContent] = useState();
  const [raw, setRaw] = useState("");
  const [highlight, setHighlight] = useState();
  const [newFileName, setNewFileName] = useState("");
  const [alert, setAlert] = useState();
  const [focusItem, setFocusItem] = useState();
  const [searchText, setSearchText] = useState("");
  const [editorScroll, setEditorScroll] = useState(0);
  const [saved, setSaved] = useState();

  const editor = useRef();
  const editorHighilght = useRef();
  const contentView = useRef();

  useEffect(() => {
    setFiles(getFile());
  }, []);

  useEffect(() => {
    if (selectedFile) {
      const data = getData(selectedFile);
      setRaw(data);
      marked.parse(data, (err, res) => setContent(res));
      setHighlight(hljs.highlight(data, { language: "md" }).value);
      setSaved(undefined);
    }
  }, [selectedFile]);

  useEffect(() => {
    if (raw) {
      marked.parse(raw, (err, res) => setContent(res));
      setHighlight(hljs.highlight(raw, { language: "md" }).value);
      const data = getData(selectedFile);
      if (data !== raw) setSaved(false);
    }
  }, [raw]);

  useEffect(() => {
    if (editor.current) editor.current.scrollTop = editorScroll;
    if (editorHighilght.current)
      editorHighilght.current.scrollTop = editorScroll;
    if (contentView.current) contentView.current.scrollTop = editorScroll;
  }, [
    editorScroll,
    editor.current,
    editorHighilght.current,
    contentView.current,
  ]);

  const handleContentScroll = (event) => {
    setEditorScroll(event.target.scrollTop);
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
    if (focusItem.file === selectedFile) {
      setRaw("");
      setContent(undefined);
      setHighlight(undefined);
    }
    setFocusItem(undefined);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    writeFile(`${newFileName}.md`, "");
    setAlert(`${newFileName} Created`);
    refresh();
  };

  const save = () => {
    const pretty = prettier.format(event.target.value, {
      parser: "markdown",
      plugins: [markdownParser],
    });
    setRaw(pretty);
    writeFile(selectedFile, pretty);
    setAlert("Formatted");
    setSaved(true);
  };

  const handleCtrl = (event) => {
    if (event.ctrlKey && event.key === "s") save();
  };

  const handleChange = (event) => {
    setRaw(event.target.value);
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
        <Stack padding="8px" gap={1}>
          <TextField
            label="Search"
            variant="standard"
            value={searchText}
            onChange={(ev) => setSearchText(ev.target.value)}
          />
        </Stack>
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
              required
            />
          </form>
        </Box>
      </Stack>
      <Divider orientation="vertical" flexItem />
      <Stack flex={1} gap={1}>
        <Stack
          direction="row"
          alignItems="center"
          paddingX={1}
          paddingTop={0.5}
        >
          <Box flex={1}>
            <Typography fontWeight={500} variant="h6">
              {selectedFile || "Open File To Edit"}
            </Typography>
          </Box>
          {saved !== undefined && (
            <Alert severity={saved ? "success" : "info"}>
              {saved ? "Saved" : "Unsaved"}
            </Alert>
          )}
          <Box flex={1}></Box>
        </Stack>
        <Divider orientation="horizontal" flexItem />
        <Stack direction="row" overflow="auto" flex={1}>
          <Box flex={1} position="relative">
            <Box
              className="highlight-js md-editor"
              dangerouslySetInnerHTML={{ __html: highlight }}
              ref={editorHighilght}
            ></Box>
            {selectedFile && (
              <textarea
                className="file-edit md-editor"
                value={raw}
                onChange={handleChange}
                style={{ resize: "none" }}
                onScroll={handleContentScroll}
                onKeyDown={handleCtrl}
                ref={editor}
              ></textarea>
            )}
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box
            component="div"
            flex={1}
            padding="16px"
            overflow="auto"
            className="md-view"
            ref={contentView}
            onScroll={handleContentScroll}
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
        <MenuItem>Export</MenuItem>
        <MenuItem onClick={() => handleDelete(focusItem.file)}>
          <Typography color="danger">Delete</Typography>
        </MenuItem>
      </Menu>
    </Stack>
  );
}
