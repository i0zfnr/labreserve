<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Booking extends Model {
 protected $guarded = [];
 protected function casts(): array { return ['start_at'=>'datetime','end_at'=>'datetime','expires_at'=>'datetime','reviewed_at'=>'datetime','approval_required'=>'boolean']; }
 public function lab() { return $this->belongsTo(Lab::class); }
 public function user() { return $this->belongsTo(User::class); }
}
