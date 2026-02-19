import { useState } from 'react'
import './App.css'
import { Container, TextField, Typography, Box, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress } from '@mui/material'
import axios from 'axios'

function App() {

  const [emailContent , setEmailContent] = useState('')
  const [tone , setTone] = useState('')
  const [generatedReply , setGeneratedReply] = useState('')
  const [loading , setLoading] = useState(false)
  const [error , setError] = useState(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await axios.post('http://localhost:8080/api/email/generate', {
        emailContent,
        tone
      })

      setGeneratedReply(typeof response.data === 'string' ? response.data : JSON.stringify(response.data))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py:4}}>
      <Typography variant="h3" component="h1" gutterBottom>
        Email Automation App
      </Typography>

      <Box sx={{ mt: 3 }}>
        <TextField fullWidth 
        label="Email Content" 
        multiline 
        rows={6} 
        value={emailContent} 
        onChange={(e) => setEmailContent(e.target.value)} 
        sx={{mb:2}}/>


        <FormControl fullWidth sx={{mb:3}}>
          <InputLabel>
            Tone (Optional)
          </InputLabel>
          <Select value={tone || ''} 
          onChange={(e) => setTone(e.target.value)} 
          sx={{width:200}}>
            <MenuItem value="">None</MenuItem>
            <MenuItem value="professional">Professional</MenuItem>
            <MenuItem value="formal">Formal</MenuItem>
            <MenuItem value="casual">Casual</MenuItem>
            <MenuItem value="friendly">Friendly</MenuItem>
          </Select>
        </FormControl>

        <Button 
        variant='contained'
        onClick={handleSubmit}
        disabled={!emailContent || loading}>
          {loading ? <CircularProgress size={24}/> : 'Generate Reply'}
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {generatedReply && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generated Reply:
          </Typography>
          <TextField
          fullWidth
          multiline
          rows={6}
          variant='outlined'
          value={generatedReply || ''}
          InputProps={{
            readOnly: true,
          }}/>
          <Button
          variant='outlined'
          sx={{mt:2}}
          onClick={() => navigator.clipboard.writeText(generatedReply)}>
            Copy to Clipboard
          </Button>
            </Box>)}
    </Container>
  )
}

export default App
