import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

const productschema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true, index:true },
  price: { type: Number, required: true },
  thumbnail: {type: String, required: true, },
  code: { type: String, required: true, unique: true },
  stock: { type: Number, required: true },
  category: { type: String, enum: ["Accion", "Aventura", "Deportes", "Terror"], default: "Accion"},
  status: { type: Boolean, default: true }
  }, 
  { versionKey: false });

productschema.plugin(mongoosePaginate);
const ProductModel  = mongoose.model('products',productschema);

export default ProductModel;

