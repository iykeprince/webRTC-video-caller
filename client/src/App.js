import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client';
import Peer from 'simple-peer'
import Room from './screens/Room';

const socket = io('http://localhost:4000')

function App() {
  const [room, setRoom] = useState("")
  const [me, setMe] = useState("")
  const [currentStream, setCurrentStream] = useState(null)

  const [receivingCall, setReceivingCall] = useState(false)
  const [caller, setCaller] = useState("")
  const [callerSignal, setCallerSignal] = useState()
  const [callAccepted, setCallAccepted] = useState(false)
  const [callEnded, setCallEnded] = useState(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  const myVideoRef = useRef(null)
  const userVideoRef = useRef(null)
  const connectionRef = useRef(null)

  const [userToCallInput, setUserToCalInput] = useState("")
  useEffect(() => {
    socket.on("me", (id) => {
      setMe(id);
      console.log("me", id);
    });
  }, []);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setCurrentStream(currentStream)
        myVideoRef.current.srcObject = currentStream;
      });

    socket.on('calluser', ({ from, name, signal }) => {
      setReceivingCall(true)
      setCaller(from)
      setName(name)
      setCallerSignal(signal)
    })

  }, [socket])

  const callUser =(id) => {
    console.log('id',id)
    setLoading(true)
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: currentStream,
    })

    console.log('initiate a call to ', id, peer)

    peer.on('signal', (data) => {
      socket.emit('calluser', {
        userToCall: id,
        signalData: data,
        from: me,
        name: 'Johnny Call'
      })
    })

    peer.on('stream', (stream) => {
      userVideoRef.current.srcObject = stream;
    })

    socket.on('callaccepted', ({ signal }) => {
      setCallAccepted(true)
      peer.signal(signal)
    })

    connectionRef.current = peer;
  }

  const answerCall =() => {
    setCallAccepted(true)

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: currentStream,
    })

    peer.on('signal', (data) => {
      socket.emit('answercall', { signal: data, to: caller })
    })

    peer.on('stream', (stream) => {
      userVideoRef.current.srcObject = stream;
    })
    peer.signal(callerSignal);

    connectionRef.current = peer;
  }

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
    window.location.reload();
  };

  return (
    <div className='container'>
      <div>
        <div>
          <video ref={myVideoRef} width="400" height="400" autoPlay />
        </div>
        <div>
          <video ref={userVideoRef} width="400" height="400" autoPlay />
        </div>
      </div>
      <div>
        <input type="text" name="userToCallInput" value={userToCallInput} onChange={e => setUserToCalInput(e.target.value)} />
        <button onClick={() => callUser(userToCallInput)}>Initiate a call</button>
        {!loading && <button onClick={() => answerCall()}>Accept Call</button>}
      </div>

      <button onClick={()=> leaveCall()}>End call</button>

    </div>
  )

}

export default App;
