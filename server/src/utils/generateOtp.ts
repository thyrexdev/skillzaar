export const generateOtp = (length: number = 6): string => {
  if (length < 4 || length > 10) {
    throw new Error('OTP length must be between 4 and 10 digits');
  }
  
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};
