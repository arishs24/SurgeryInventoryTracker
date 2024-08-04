'use client'
import Image from "next/image";
import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { firestore } from "@/firebase"; // Make sure this path is correct
import { Box, Modal, Typography, Stack, TextField, Button } from '@mui/material'

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
    await updateInventory();
  }

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
  }

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box width="100vw" height="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center" gap={2}>
      <TextField
        variant="outlined"
        placeholder="Search items"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />
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
          <Stack width="100%" direction="row" spacing={2}>
            <TextField 
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
              }}
            />
          </Stack>
          <Button
            variant="outlined" onClick={() => {
              addItem(itemName);
              setItemName('');
              handleClose();
            }}
          >
            Add
          </Button>
        </Box>
      </Modal>
      <Button variant="contained" onClick={handleOpen}>
        Add New Item
      </Button>
      <Box border='1px solid #333' display="flex" flexDirection="column" alignItems="center" width="800px" p={2}>
        <Box width="100%" height="100px" bgcolor="8DD8e6"></Box>
        <Typography variant='h2' color='#333'>
          Inventory Items
        </Typography>
        <Stack width="100%" height="300px" spacing={2} overflow="auto">
          {filteredInventory.map(({ name, quantity }) => (
            <Box key={name} width="100%" minHeight="150px" display="flex" justifyContent="space-between" alignItems="center" bgcolor="#f0f0f0" padding={5}>
              <Typography variant="h3" color="#333" textAlign="center">
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant="h3" color="#333" textAlign="center">
                {quantity}
              </Typography>
              <Button variant="contained" onClick={() => removeItem(name)}>
                Remove
              </Button>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
