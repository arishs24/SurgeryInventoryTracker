'use client'
import { useState, useEffect } from "react";
import axios from "axios";
import { collection, query, getDocs, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore } from "@/firebase"; // Make sure this path is correct
import { Box, Modal, Typography, Stack, TextField, Button, Input, Paper, AppBar, Toolbar, Container } from '@mui/material';

const PROJECT_ID = process.env.NEXT_PUBLIC_GCP_PROJECT_ID;
const ENDPOINT_ID = process.env.NEXT_PUBLIC_GCP_ENDPOINT_ID;
const LOCATION = 'us-central1'; // Adjust based on your model's region

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [image, setImage] = useState(null);
  const [classification, setClassification] = useState('');
  const [recipe, setRecipe] = useState('');

  const storage = getStorage();

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const classifyImage = async (imageBlob) => {
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    try {
      const response = await axios.post('/api/classify', { image: base64Image });
      const { classification } = response.data;
      setClassification(classification);
      return classification;
    } catch (error) {
      console.error("Error classifying image: ", error);
      return '';
    }
  };

  const addItem = async (item, imageUrl, classification) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1, imageUrl, classification });
    } else {
      await setDoc(docRef, { quantity: 1, imageUrl, classification });
    }
    await updateInventory();
  };

  const handleImageUpload = async () => {
    if (image) {
      const storageRef = ref(storage, `images/${image.name}`);
      await uploadBytes(storageRef, image);
      const imageUrl = await getDownloadURL(storageRef);
      const imageBlob = await fetch(imageUrl).then(res => res.blob());
      const imageClassification = await classifyImage(imageBlob);
      await addItem(itemName, imageUrl, imageClassification);
      setItemName('');
      setImage(null);
      setClassification('');
      handleClose();
    } else {
      await addItem(itemName, '', '');
      setItemName('');
      handleClose();
    }
  };

  const getRecipeSuggestion = async () => {
    const pantryContents = inventory.map(item => item.name);

    try {
      const response = await axios.post('/api/recipe', { pantryContents });
      const { recipe } = response.data;
      setRecipe(recipe);
    } catch (error) {
      console.error("Error fetching recipe suggestion: ", error);
    }
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
      await updateInventory();
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            Inventory Management
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Box mt={4} display="flex" flexDirection="column" alignItems="center">
          <TextField
            variant="outlined"
            placeholder="Search items"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2, width: '100%' }}
          />
          <Paper elevation={3} sx={{ width: '100%', p: 2 }}>
            <Button variant="contained" onClick={handleOpen} sx={{ mb: 2 }}>
              Add New Item
            </Button>
            <Button variant="contained" color="primary" onClick={getRecipeSuggestion} sx={{ mb: 2 }}>
              Get Recipe Suggestion
            </Button>
            {recipe && (
              <Box mt={2} p={2} border="1px solid #333" borderRadius="8px" width="100%">
                <Typography variant="h5">Recipe Suggestion:</Typography>
                <Typography variant="body1">{recipe}</Typography>
              </Box>
            )}
          </Paper>
          <Box border='1px solid #333' display="flex" flexDirection="column" alignItems="center" width="100%" p={2} mt={4}>
            <Typography variant='h4' color='#333' gutterBottom>
              Inventory Items
            </Typography>
            <Stack width="100%" height="300px" spacing={2} overflow="auto">
              {filteredInventory.map(({ name, quantity, imageUrl, classification }) => (
                <Box key={name} width="100%" minHeight="150px" display="flex" justifyContent="space-between" alignItems="center" bgcolor="#f0f0f0" padding={2} mb={2} borderRadius="8px">
                  <Typography variant="h6" color="#333">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography variant="body1" color="#333">
                    Quantity: {quantity}
                  </Typography>
                  {classification && (
                    <Typography variant="body2" color="textSecondary">
                      Classification: {classification}
                    </Typography>
                  )}
                  {imageUrl && (
                    <img src={imageUrl} alt={name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '50%' }} />
                  )}
                  <Button variant="contained" color="secondary" onClick={() => removeItem(name)}>
                    Remove
                  </Button>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Container>
      <Modal open={open} onClose={handleClose}>
        <Box position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="white"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: "translate(-50%, -50%)"
          }}
        >
          <Typography variant="h6">Add item</Typography>
          <Stack width="100%" direction="column" spacing={2}>
            <TextField 
              variant="outlined"
              fullWidth
              placeholder="Item name"
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
              }}
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files.length > 0) {
                  setImage(e.target.files[0]);
                }
              }}
            />
          </Stack>
          <Button
            variant="outlined"
            onClick={handleImageUpload}
          >
            Add
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
