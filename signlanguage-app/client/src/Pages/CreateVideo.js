import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom'
import { Row, Form, Col, Button, Alert } from "react-bootstrap";
import { baseURL } from "../Config/config";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "font-awesome/css/font-awesome.min.css";
import axios from "axios";
import ConfirmModal from "../Components/CreateVideo/ConfirmModal";

function CreateVideo() {
  const [video, setVideo] = useState({
    title: "",
    desc: "",
    createdBy: "",
    type: "PUBLIC"
  });
  const [validated, setValidated] = useState(false);
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState("");
  const [videoId, setVideoId] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [speechError, setSpeechError] = useState("");
  const [browserSupport, setBrowserSupport] = useState(true);
  
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const navigate = useNavigate()

  // Check browser support on component mount
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      setBrowserSupport(false);
      setSpeechError("Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.");
    } else {
      // Check if we're on HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isSecure) {
        setSpeechError("Speech recognition requires HTTPS or localhost. Please access the site via HTTPS.");
      }
    }
  }, [browserSupportsSpeechRecognition]);

  const handleInputChanges = (event) => {
    setVideo((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const startListening = async () => {
    setSpeechError("");
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      // Start speech recognition
      SpeechRecognition.startListening({ 
        continuous: true,
        language: 'en-US',
        interimResults: true
      });
    } catch (error) {
      console.error("Speech recognition error:", error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setSpeechError("Microphone permission denied. Please allow microphone access in your browser settings.");
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setSpeechError("No microphone found. Please connect a microphone and try again.");
      } else {
        setSpeechError(`Speech recognition error: ${error.message}. Please try again or use text input mode.`);
      }
    }
  };

  const stopListening = () => {
    try {
      SpeechRecognition.stopListening();
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
      setSpeechError("Error stopping speech recognition. Please refresh the page if issues persist.");
    }
  };

  const validateVideo = () => {
    if (!video.title || !video.desc || !video.createdBy) return false;
    else if (mode === "text" && !text) return false;
    else if (mode === "file" && !file) return false;
    else if (mode === "speech" && !transcript) return false;
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validateVideo() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);

    let content = "";
    if (mode === "text") content = text;
    else if (mode === "file") content = await file.text();
    else if (mode === "speech") content = transcript;

    const newVideo = {
      ...video,
      content: content,
    };

    axios
      .post(`${baseURL}/videos/create-video`, newVideo)
      .then((res) => {
        setVideoId(res.data.videoId)
        setShowModal(true)
        console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className="container d-flex flex-column align-items-center">
      <div className="display-5 mt-5 px-2 text-center">Create a New Video!</div>
      <div className="lead mb-5 px-2 text-center">
        Fill this form and provide your content to create a video using ISL in a
        few clicks!
      </div>

      <Row className="container">
        <Form
          noValidate
          validated={validated}
          onSubmit={handleSubmit}
          className="d-flex flex-column justify-content-center align-items-center p-0"
        >
          <Form.Group controlId="title" as={Col} xs="12" md="7" className="my-3">
            <Form.Label>Title of Video</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="Title of Video"
              value={video.title}
              name="title"
              onChange={handleInputChanges}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
            <Form.Control.Feedback type="invalid">
              Please enter a title.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group controlId="desc" as={Col} xs="12" md="7" className="mx-0 px-0 my-3">
            <Form.Label>Description of Video</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="Description of Video"
              name="desc"
              onChange={handleInputChanges}
              as="textarea"
              rows={4}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
            <Form.Control.Feedback type="invalid">
              Please enter a description.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group controlId="createdBy" as={Col} xs="12" md="7" className="my-3">
            <Form.Label>Name of Creator</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="Name of Creator"
              name="createdBy"
              onChange={handleInputChanges}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
            <Form.Control.Feedback type="invalid">
              Please enter your name as the creator.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group controlId="type" as={Col} xs="12" md="7" className="my-3">
            <Form.Label>Select the type of video</Form.Label>
            <Form.Select
              required
              placeholder="Select a type"
              value={video.type}
              name="type"
              onChange={handleInputChanges}
            >
              <option value="PUBLIC">Public - Your video will be visible to the entire communtiy</option>
              <option value="PRIVATE">Private - Your video can be accessed by people with whom you share the video ID</option>
            </Form.Select>
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
            <Form.Control.Feedback type="invalid">
              Please select a video type.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group controlId="mode" as={Col} xs="12" md="7" className="my-3">
            <Form.Label>Select a mode to provide your content</Form.Label>
            <Form.Select
              required
              placeholder="Select a mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="text">Type the text</option>
              <option value="speech">Speak through mic</option>
              <option value="file">Upload a text file</option>
            </Form.Select>
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
            <Form.Control.Feedback type="invalid">
              Please select a mode.
            </Form.Control.Feedback>
          </Form.Group>

          {mode === "text" && (
            <Form.Group controlId="text" as={Col} xs="12" md="7" className="my-3">
              <Form.Label>Enter your content here</Form.Label>
              <Form.Control
                required
                type="text"
                placeholder="Type your content here..."
                name="content"
                onChange={(e) => setText(e.target.value)}
                as="textarea"
                rows={8}
              />
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              <Form.Control.Feedback type="invalid">
                Please type your content.
              </Form.Control.Feedback>
            </Form.Group>
          )}

          {mode === "file" && (
            <Form.Group controlId="formFile" as={Col} xs="12" md="7" className="my-3">
              <Form.Label>Upload your text (.txt) file here</Form.Label>
              <Form.Control
                type="file"
                accept=".txt"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              <Form.Control.Feedback type="invalid">
                Please upload a text file here.
              </Form.Control.Feedback>
            </Form.Group>
          )}

          {mode === "speech" && (
            <div className="col-md-7 d-flex flex-column justify-content-center my-3">
              {!browserSupport && (
                <Alert variant="warning" className="mb-3">
                  <strong>Browser Not Supported:</strong> Speech recognition is not supported in your browser. 
                  Please use Chrome, Edge, or Safari, or switch to text input mode.
                </Alert>
              )}
              {speechError && browserSupport && (
                <Alert variant="danger" className="mb-3" dismissible onClose={() => setSpeechError("")}>
                  <strong>Error:</strong> {speechError}
                </Alert>
              )}
              {browserSupport && !speechError && (
                <Alert variant="info" className="mb-3">
                  <strong>Tip:</strong> Make sure you've granted microphone permissions. Speech recognition works best in Chrome, Edge, or Safari browsers.
                </Alert>
              )}
              <div className="row d-flex justify-content-center">
                <label className="mb-2">
                  Speech Recognition: <strong>{listening ? "ON" : "OFF"}</strong>
                  {listening && <span className="text-success ms-2">● Listening...</span>}
                </label>
                <button
                  type="button"
                  className="btn btn-primary col-md-3 mx-3"
                  onClick={startListening}
                  disabled={!browserSupport || listening}
                >
                  <i className="fa fa-microphone" /> Start Listening
                </button>
                <button
                  type="button"
                  className="btn btn-danger col-md-3 mx-3"
                  onClick={stopListening}
                  disabled={!listening}
                >
                  <i className="fa fa-microphone-slash" /> Stop Listening
                </button>
                <button
                  type="button"
                  className="btn btn-secondary col-md-3 mx-3"
                  onClick={() => {
                    resetTranscript();
                    setSpeechError("");
                  }}
                  disabled={!transcript}
                >
                  <i className="fa fa-trash" /> Clear Text
                </button>
              </div>
            </div>
          )}

          {mode === "speech" && (
            <Form.Group
              controlId="speech-text"
              as={Col}
              xs="12"
              md="7"
              className="my-3"
            >
              <Form.Label>
                Use the controls and speak through your mic
              </Form.Label>
              <Form.Control
                required
                readOnly
                type="text"
                placeholder={browserSupport ? "Your speech will be transcribed here..." : "Speech recognition not supported in your browser"}
                name="content"
                value={transcript || ""}
                as="textarea"
                rows={8}
                disabled={!browserSupport}
              />
              {transcript && (
                <Form.Text className="text-muted">
                  {transcript.split(' ').length} words transcribed
                </Form.Text>
              )}
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              <Form.Control.Feedback type="invalid">
                {browserSupport ? "Please speak through your mic." : "Speech recognition is not available. Please use text input mode."}
              </Form.Control.Feedback>
            </Form.Group>
          )}

          <Button type="submit" className='mt-3'>Submit form</Button>
        </Form>
      </Row>

      <ConfirmModal show={showModal} onHide={(e) => {
        setShowModal(false)
        navigate('/sign-kit/all-videos', { replace: true })
      }} videoId={videoId} />
    </div>
  );
}

export default CreateVideo;
