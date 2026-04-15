function selectionSort(arr){
  
    const n = arr.length;
   
    for(let i = 0; i < n - 1; i++){
      let minindex = i;
      
      for(let j = i + 1; j < n; j++){
        if(arr[j] < arr[minindex]){
          minindex = j
        }
      }
      if(minindex !== i){
        let temp = arr[i]
        arr[i] = arr[minindex];
        arr[minindex] = temp
      }
    }
    return arr;
  }
  
  console.log(selectionSort([1,2,5,76,4]))